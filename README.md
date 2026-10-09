Run backend commands from `server/` so dotenv loads the correct `.env` file. Requests are saved before notification emails are sent; email failures are logged and do not undo a saved request.

### 3. Seed the service catalog

For a new development database, run this from `server/`:

```sh
node seed.js
```

**This replaces every existing service record in the configured database with the 16 seed services.** It does not delete quotes or bookings. Full descriptions are read from the templates in `booking.html`, so keep that file in its expected location.

### 4. Start the API

From `server/`:

```sh
node server.js
```

Check the API in another terminal:

```sh
curl http://localhost:5001/api/health
```

Expected response:

```json
{"status":"ok"}
```

The health endpoint checks HTTP availability only. The server can start without MongoDB, so also look for `Connected to MongoDB` in the server logs before testing database features.

### 5. Serve the frontend

Open another terminal at the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit [http://localhost:8000](http://localhost:8000), then open the booking page and choose **Continue as Guest** to try the flow. No frontend build step is required. The Express server does not serve the HTML pages.

The frontend’s `apiBaseUrls` array in `js/script.js` currently contains `http://localhost:5001` and `http://localhost:5000`. Keep it aligned with the API port you use. Fallback service data allows browsing when the API is unavailable, but submitting quotes and bookings requires the API and MongoDB.

## API reference

Request bodies use JSON with `Content-Type: application/json`.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| `GET` | `/` | Returns the API status message. |
| `GET` | `/api/health` | Returns `{"status":"ok"}`. |
| `GET` | `/api/services` | Returns the service catalog. |
| `PUT` | `/api/services/:id` | Updates a service by its MongoDB document ID. |
| `POST` | `/api/quotes` | Saves a quote request and triggers a notification. |
| `POST` | `/api/bookings` | Saves a booking request and triggers a notification. |

Quote requests require `name`, `phone`, and `serviceType`. The homepage sends `maintenance`, `interior`, `full`, or `ceramic` as the service type.

Booking requests require `vehicleType`, `vehicleMake`, `vehicleModel`, `serviceName`, `servicePrice`, `firstName`, `lastName`, and `phone`. Supported vehicle types are `Sedan`, `SUV`, `Truck`, and `Van`. Optional fields are `email`, `stains`, and `petHair`; both condition flags default to `false`.

Successful quote and booking submissions return HTTP `201` with the saved record. Missing required fields return `400`; save failures return `500`. Service updates return `404` when no matching document is found.

## Tests

From `server/`:

```sh
npm test
```

The suite covers API routes, quote and booking form behavior, notification email content, service seeding, and API service loading with fallback behavior. Database operations are stubbed in the tests; they do not verify a live MongoDB connection.

## Updating content

- **Branding and layout:** edit the HTML pages and `css/style.css`.
- **Vehicle choices:** edit `carData` in `js/script.js`.
- **Service catalog:** edit `server/seed.js` for future seeds, or update existing records through the API. Keep `fallbackServiceDetails` in `js/script.js` aligned with the catalog.
- **Detailed descriptions:** edit the `desc-*` templates in `booking.html`. The booking UI reads these templates directly, even though the database also stores `fullDescription`.
- **Quote dropdown:** update its labels and prices in `index.html`; these options are static.
- **Images:** provide the paths referenced by the HTML and CSS, including `images/logo.png`, `images/gallery/gallery1.png` through `gallery3.png`, and the background images. Match filename casing exactly; the CSS references both `background2.PNG` and `background2.png`.

## Deployment

The `ci-cd.yml` workflow validates the static site and deploys it to GitHub Pages on matching pushes to `main` or `testing`. Its push and pull-request triggers filter for frontend file changes. Pull requests targeting `testing` run validation. Manual dispatch runs validation without the push-only deployment steps.

The `backend-ci.yml` workflow installs dependencies, runs tests, and checks `/api/health`. It uses `npm ci` and expects a committed `server/package-lock.json`. It reads `MONGODB_URI` from repository secrets, although the HTTP health check can pass without a database connection.

GitHub Pages hosts the frontend only. To connect a deployed site:

1. Deploy the Express API to a Node.js host with access to MongoDB.
2. Configure the environment variables on that host and start the API with `node server.js` from `server/`.
3. Replace the localhost entries in `apiBaseUrls` with the deployed API’s HTTPS URL.
4. Publish the frontend and verify service loading and form submissions.

The service update endpoint currently has no authentication or authorization. Protect it before exposing the API publicly.

## Current limitations

- Booking submits a request; there is no appointment calendar, time-slot reservation, or payment processing.
- The returning-customer phone lookup and SMS verification mentioned in the interface are not implemented. Use the guest flow.
- Condition answers are saved, but the displayed stain and pet-hair fees are not added to the submitted service price. The API accepts the service price from the client without recalculating it.
