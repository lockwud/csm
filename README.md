# Sankofa Express Courier Management System

Final-year project courier management platform built with Next.js 16 App Router, TypeScript, Prisma, PostgreSQL, and Tailwind CSS.

## Features

- JWT-style HTTP-only cookie authentication with role-aware proxy protection.
- Dashboard with shipment, COD, rider, support, chart, trend, and recent-order metrics.
- Order management with waybills, tracking codes, address creation, rider assignment, and tracking events.
- Clients, riders, dispatch manifests, finance entries, payments, image orders, support tickets, rewards, reports, profile, and settings pages.
- Custom UI component library in `src/components/ui`.
- Prisma-backed API routes under `src/app/api`.
- Firebase/FCM, Paystack, email, SMS, and socket integration points with safe local stubs.

## Local Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`.
2. Run Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

3. Start the app:

```bash
npm run dev -- --webpack
```

Turbopack may hit OS file-watch limits on some machines; webpack dev mode avoids that.

## Seeded Login

- Email: `admin@sankofaexpress.com`
- Password: `Admin@2026`

## Verification

```bash
npm run lint
npm run build
```

Both commands pass in the rebuilt codebase.

Here is the full system flow as the system now works.
1. Admin Setup
Admin signs in at /admin.
From Settings, admin configures the operational foundation:
Order types: Standard, Express, Same Day, Scheduled, Bulk.
Package types: Documents, Parcel, Food, Boxes, Electronics, etc.
Delivery zones and service zones.
Pricing rules per zone and order type.
Payment methods.
Notification channels.
Codes & IDs for waybill, tracking code, payment reference, finance entry, dispatch manifest, and support ticket.
Security/change password.
These settings are no longer just UI. They feed into onboarding, order creation, pricing, references, payment, and dispatch flow.
2. User And Rider Onboarding
Clients and riders start from the public login/signup flow at /login and /register.
Client registration captures:
Login details.
Sender/receiver identity.
Contact details.
Pickup/service area from admin delivery zones.
Main package type from admin package types.
Whether they send, receive, or both.
Rider registration captures:
Login details.
Contact details.
Zone.
Vehicle type.
Vehicle registration/license plate.
Rider/vehicle license details.
Emergency contact.
Verification consent/details.
Riders do not become fully operational until admin reviews them.
3. Admin User And Rider Management
Admin manages users under access management.
Admin can:
Create users.
Edit users.
Change roles.
Change status.
Delete users.
Assign client/rider role profiles.
Admin manages riders under Riders.
Admin can:
Review submitted rider verification information.
Approve rider.
Turn rider off.
Suspend rider.
Only approved ACTIVE riders can receive assigned orders.
4. Client Order Flow
A client signs in and lands on /client/dashboard.
The client can create a quick order.
The order form now uses real admin settings:
Order type from Settings.
Package type from Settings.
Delivery zone from Settings.
Payment method from Settings.
Pricing from active pricing/service-zone rules.
The client adds:
Quantity.
Package images.
Receiver name.
Receiver phone.
Delivery zone/address.
Package description.
Payment point: sender, recipient, or split.
Payment method.
When submitted:
Package images are stored as ImageOrder / ImageOrderImage.
A real Order is created.
Waybill is generated from Codes & IDs.
Tracking code is generated from Codes & IDs.
Price is calculated from pricing rules.
Payment responsibility is calculated.
Confirmation QR/code is generated.
Tracking event is created.
Client dashboard refreshes with the order.
5. Image Order Admin Flow
Admin opens /image-orders.
Admin can:
Review submitted package photos.
Enter receiver delivery details.
Select delivery type.
Select payment point.
Select payment method.
Convert the image order into a real courier order.
Once converted:
ImageOrder becomes PROCESSED.
It links to the created Order.
The order joins normal dispatch/payment/tracking flow.
6. Payment Flow
If sender payment is required and the method is not COD/cash:
The system creates a PaymentIntent.
Payment reference comes from Codes & IDs.
Paystack transaction is initialized.
A checkout session is created.
Client is sent to Paystack authorization URL.
Paystack verify/webhook updates the payment.
When payment succeeds:
PaymentIntent becomes paid.
CheckoutSession becomes completed.
Order.amountCollected is updated.
Order.paymentStatus becomes partial or paid.
A FinanceEntry is created.
Finance reference comes from Codes & IDs.
Order tracking event records payment received.
Webhook paths available:
/api/payments/webhook/paystack
/api/v1/webhooks/paystack
7. Admin Order Management
Admin can view orders under Orders.
Orders include:
Sender details.
Receiver details.
Status.
Rider.
Payment status.
Waybill.
Tracking code.
Tracking events.
Finance/payment links.
Admin/dispatcher can assign an order to a rider.
The backend blocks assignment unless the rider is ACTIVE.
8. Dispatch Flow
Admin/dispatcher can create dispatch manifests.
Manifest code comes from Codes & IDs.
A manifest groups orders for a rider/zone.
Dispatch can track:
Manifest status.
Stops.
Stop sequence.
Rider assignment.
Order movement.
9. Rider Delivery Flow
Rider signs in and lands on /rider/dashboard.
Rider sees only their assigned data.
Rider dashboard shows:
Assigned orders.
Active orders.
Delivered orders.
Manifest count.
Live location update.
Best route ordering by nearest destination.
Receiver details.
Delivery status.
Rider can update live location.
Rider completes delivery by scanning the receiver QR code or entering the confirmation code manually.
The system checks the code server-side.
If code matches:
Order status becomes DELIVERED.
Delivered timestamp is saved.
Tracking event is created.
Rider dashboard updates.
If code does not match:
Delivery confirmation is rejected.
10. Tracking Flow
Clients/admin can track orders by tracking code.
Tracking shows:
Sender/receiver route data.
Current status.
Tracking events.
Delivery progress.
11. Notifications
Notifications are wired through:
In-app notifications.
Firebase push token/device support.
Notification pane in the topbar.
Notification settings channels.
Firebase configuration is loaded from .env, not hardcoded into source.
12. Finance Flow
Finance records are created from payment activity.
Finance can see:
Payment intents.
Transactions.
Finance entries.
COD/payment collections.
Paid/partial/unpaid states.
Payment success updates order and finance together.
13. Support Flow
Support tickets can be opened and tracked.
Support ticket reference comes from Codes & IDs.
Tickets can be linked to:
Customer/client.
Order.
Category.
Status.
Owner.
14. Reports Flow
Reports use real backend data from system modules.
Reports summarize operational and finance data from:
Orders.
Clients.
Riders.
Finance entries.
Support tickets.
Payments.
15. Access And Role Flow
Roles and permissions control access.
The main roles are:
Super Admin
Admin
Dispatcher
Support
Finance
Client
Rider
Admin can manage users and permissions. Clients and riders have separate portal dashboards and cannot use the admin dashboard as their normal flow.
End-To-End Journey
A complete real workflow looks like this:
Admin configures zones, package types, pricing, payment methods, and reference codes.
Client signs up.
Rider signs up.
Admin approves rider.
Client creates order with package images.
System calculates delivery price.
System generates waybill, tracking code, and confirmation QR.
Client pays through Paystack if required.
Payment updates order and finance.
Admin/dispatcher assigns order to active rider.
Rider receives order in rider portal.
Rider updates location and follows route.
Receiver gives QR/code at handoff.
Rider scans/enters code.
Backend verifies code.
Order becomes delivered.
Tracking, finance, dashboard, reports, and notifications all reflect the completed delivery.
