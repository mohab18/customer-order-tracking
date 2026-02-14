using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace CustomerOrderTracking.Hubs
{
    public class OrderHub : Hub
    {
        public async Task JoinCustomerGroup(Guid customerId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"customer_{customerId}");
        }

        public async Task LeaveCustomerGroup(Guid customerId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"customer_{customerId}");
        }
    }
}
