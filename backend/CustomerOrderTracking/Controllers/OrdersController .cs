using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Services;
using Microsoft.AspNetCore.Mvc;

namespace CustomerOrderTracking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<PagedResult<OrderDto>>> GetCustomerOrders( Guid customerId,
            [FromQuery] OrderFilterDto filter)
        {
            var result = await _orderService.GetCustomerOrders(customerId, filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetById(Guid id)
        {
            var order = await _orderService.GetOrderById(id);
            if (order == null)
                return NotFound();

            return Ok(order);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _orderService.DeleteOrder(id);
            return NoContent();
        }
    }
}
