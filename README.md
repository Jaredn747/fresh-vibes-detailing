# Fresh Vibes Detailing

A website and booking-request API for Fresh Vibes Mobile Detailing, serving the Orange County area. Customers can browse detailing packages, view the gallery, request a quote, and submit their vehicle and contact information for a booking.

The frontend uses plain HTML, CSS, and JavaScript. A separate Express API stores requests and service information in MongoDB and sends email notifications to the business.

## Features

- Responsive home page, mobile navigation, service packages, and photo gallery.
- Quote request form with field validation and submission feedback.
- Guest booking flow with vehicle category, make, model, service selection, and condition questions.
- A catalog of 16 services covering washes, interior detailing, paint protection, ceramic coatings, and specialty services.
- Service data loaded from the API, with built-in fallback data when loading fails.
- MongoDB storage for quotes, bookings, and services.
- Email notifications for new quote and booking requests through Nodemailer’s Gmail transport.
- Automated tests and GitHub Actions workflows for backend checks and static-site deployment.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Styling assets | Google Fonts, Font Awesome |
| API | Node.js, Express, CORS, dotenv |
| Database | MongoDB, Mongoose |
| Email | Nodemailer |
| Tests | Node.js built-in test runner |
| CI and hosting | GitHub Actions, GitHub Pages for the frontend |

## Project structure

```text
.
├── index.html                 # Home page and quote form
├── booking.html               # Booking flow and service description templates
├── gallery.html               # Photo gallery
├── css/
│   └── style.css               # Shared styles and responsive layouts
├── js/
│   └── script.js               # Navigation, forms, booking state, and API requests
├── server/
│   ├── package.json            # Backend dependencies and test command
│   ├── server.js               # Express entry point and database connection
│   ├── seed.js                 # Service catalog seed utility
│   ├── models/                 # Booking, quote, and service schemas
│   ├── routes/                 # Booking, quote, and service endpoints
│   ├── test/                   # API, form, email, and service-data tests
│   └── utils/
│       └── email.js            # Business notification emails
└── .github/workflows/
    ├── backend-ci.yml          # Backend tests and HTTP health check
    └── ci-cd.yml               # Static-site validation and Pages deployment
```

## Local setup

### Prerequisites

- Node.js and npm. The included CI workflows use Node.js 20.
- A running MongoDB instance or a MongoDB connection URI.
- Python 3 for the static-server command below, or another local static server.
- Gmail credentials if you want to test email delivery.

### 1. Install backend dependencies

From the repository root:

```sh
cd server
npm install
```

### 2. Configure the environment

Create `server/.env`:

```dotenv
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/fresh-vibes-detailing

# Configure these to enable business notification emails.
EMAIL_USER=your-account@gmail.com
EMAIL_PASS=your-gmail-app-password
NOTIFICATION_EMAIL=your-notification-inbox@example.com
```

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Defaults to `5000`; this setup uses `5001`. |
| `MONGODB_URI` | Database connection string, required for seeding and database-backed endpoints. |
| `EMAIL_USER` | Gmail account used to send notifications. |
| `EMAIL_PASS` | Credential used to authenticate the Gmail transport. |
| `NOTIFICATION_EMAIL` | Business inbox that receives quote and booking notifications. |

Keep `.env` files out of version control and published site artifacts. Add `server/.env` and `server/node_modules/` to the root `.gitignore` if they are not already ignored.

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
