using CustomerOrderTracking.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerOrderTracking.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<Order> Orders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.Email).IsUnique();

                // Cascade delete
                entity.HasMany(e => e.Orders)
                    .WithOne(e => e.Customer)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
            });
        }
    }
}
