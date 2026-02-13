using CustomerOrderTracking.BackgroundServices;
using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Services;
using Microsoft.AspNetCore.Mvc;

namespace CustomerOrderTracking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;
       

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
            
        }

        [HttpGet]
        public async Task<ActionResult<List<CustomerDto>>> GetAll()
        {
            var customers = await _customerService.GetAllCustomers();
            return Ok(customers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetById(Guid id)
        {
            var customer = await _customerService.GetCustomerById(id);
            if (customer == null)
                return NotFound();

            return Ok(customer);
        }

        [HttpPost]
        public async Task<ActionResult<CustomerDto>> Create(CreateCustomerDto dto)
        {
            try
            {
                var customer = await _customerService.CreateCustomer(dto);

            
                

                return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateCustomerDto dto)
        {
            try
            {
                var existing = await _customerService.GetCustomerById(id);
                if (existing == null)
                    return NotFound();

                var wasActive = existing.IsActive;

                await _customerService.UpdateCustomer(id, dto);


                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            
            await _customerService.DeleteCustomer(id);
            return NoContent();
        }
    }
}
