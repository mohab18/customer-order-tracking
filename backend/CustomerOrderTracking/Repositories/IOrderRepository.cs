using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Models;

namespace CustomerOrderTracking.Repositories
{
    public interface IOrderRepository
    {
        Task<PagedResult<Order>> GetCustomerOrders(Guid customerId, OrderFilterDto filter);
        Task<Order?> GetById(Guid id);
        Task<Order> Create(Order order);
        Task Delete(Guid id);
    }
}
