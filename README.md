# customer-order-tracking
Customer Order Tracking – Local Setup Guide


This application is a customer order tracking system built with:

- Backend: .NET 8 Web API, Entity Framework Core, SignalR
- Frontend: Angular
- Database: PostgreSQL

Database Migration is used and SignalR plus BackgroundService are also used .
Backend follows repository/Service pattern.
FrontEnd uses normal styling in Customer Dashboard and angular material in Orders Page 


Requirements
Make sure the following are installed on your machine:

- .NET 8 SDK (install from here if not installed :  https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- Node.js 20+ (install from here if not installed : https://nodejs.org/ )
- Angular CLI  (write this command in command prompt :npm install -g @angular/cli )
- PostgreSQL (install from here if not installed : Download: https://www.postgresql.org/download/ )



Step 1: Clone the Repository
```
git clone <https://github.com/mohab18/customer-order-tracking.git>
cd customer-order-tracking

```

Step 2: Run Backend which also run Migration
```
cd backend
cd CustomerOrderTracking
```
first run this command with you own postgres password to connect : `$env:ConnectionStrings__DefaultConnection="Host=localhost;Database=customer_order_tracking;Username=postgres;Password=YOUR_PASSWORD"`
then run this command : `dotnet run`

Now you should see the backend running on http://localhost:7086 and the database should be created and the migration should be applied.
Also you can check swagger to test backend endpoints : http://localhost:7086/swagger


Step 3: Run Frontend
```
cd ../../frontend
cd customer-order-ui
run npm install
run ng serve 
```
Now frontend should be running on http://localhost:4200.


At first no Customers are added you can add one from UI or Swagger and check the 1 min order generation feature.

Pages 2
Page 1 : Customer Dashboard : Customer Cards with their info and orders count and order status, Create Customer Form , Update Customer Form and Delete Customer Button.
Page 2 : Orders Page : Orders Table with pagination and sorting, Filterng by Date or PriceAmount , and AutoUpdate Toggle Button to enable or disable real time updates.


Enjoy using the Customer Order Tracking application!


