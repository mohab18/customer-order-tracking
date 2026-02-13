using CustomerOrderTracking.DTOs;

namespace CustomerOrderTracking.Services
{
    public interface IOrderService
    {
        Task<PagedResult<OrderDto>> GetCustomerOrders(Guid customerId, OrderFilterDto filter);
        Task<OrderDto?> GetOrderById(Guid id);
        Task<OrderDto> CreateOrder(Guid customerId, string description, decimal amount);
        Task DeleteOrder(Guid id);
    }
}
