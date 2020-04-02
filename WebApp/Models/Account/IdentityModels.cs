using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace WebApp.Models
{
    public class ApplicationUser : IdentityUser<Guid, UserLogin, UserRole, UserClaim>
    {
        //public string Name{ get; set; }
        //public DateTime? Birthdate { get; set; }
        public ApplicationUser() : base() { }

        public Guid? userId;

        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(ApplicationUserManager manager, string UserName)
        {
            // Обратите внимание, что authenticationType должен совпадать с типом, определенным в CookieAuthenticationOptions.AuthenticationType
            ClaimsIdentity claims = new ClaimsIdentity(DefaultAuthenticationTypes.ApplicationCookie);
            claims.AddClaim(new Claim("Name", UserName));
            claims.AddClaim(new Claim("UserName", UserName));
            return claims;
           // var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Здесь добавьте утверждения пользователя
           // return userIdentity;
        }
    }

    public class IdentityDbInit : NullDatabaseInitializer<ApplicationDbContext> { }
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid, UserLogin, UserRole, UserClaim>
    {
        public ApplicationDbContext()
            : base("Testing")
        {
        }
        static ApplicationDbContext()
        {
            Database.SetInitializer(new IdentityDbInit());
        }

        public static ApplicationDbContext Create()
        {
            return new ApplicationDbContext();
        }
    }
    public class UserLogin : IdentityUserLogin<Guid>
    {
        public UserLogin() : base() { }
    }
    public class UserRole : IdentityUserRole<Guid>
    {
        public UserRole() : base() { }
    }
    public class UserClaim : IdentityUserClaim<Guid>
    {
        public UserClaim() : base() { }
    }
   
    public class ApplicationRole: IdentityRole<Guid, UserRole>
    {
        public ApplicationRole() : base() { }
    }
    public interface IAppUserStore : IUserStore<ApplicationUser, Guid>
    {

    }

    public class AppUserStore :
    UserStore<ApplicationUser, ApplicationRole, Guid, UserLogin, UserRole, UserClaim>,
    IAppUserStore
    {
        public AppUserStore() : base(new ApplicationDbContext())
        {

        }

        public AppUserStore(ApplicationDbContext context) : base(context)
        {

        }
    }

    public class ApplicationUserManager : UserManager<ApplicationUser, Guid>
    {
        public ApplicationUserManager(IUserStore<ApplicationUser, Guid> store)
            : base(store)
        {
        }
        public ApplicationUserManager(IAppUserStore store) : base(store) { }

        public static ApplicationUserManager Create(IdentityFactoryOptions<ApplicationUserManager> options, IOwinContext context)
        {
            var manager = new ApplicationUserManager(new AppUserStore(context.Get<ApplicationDbContext>()));
            // Настройка логики проверки имен пользователей
            //manager.UserValidator = new UserValidator<ApplicationUser>(manager)
            //{
            //    AllowOnlyAlphanumericUserNames = false,
            //    RequireUniqueEmail = false
            //};

            // Настройка логики проверки паролей
            //manager.PasswordValidator = new PasswordValidator
            //{
            //    RequiredLength = 6,
            //    RequireNonLetterOrDigit = true,
            //    RequireDigit = true,
            //    RequireLowercase = true,
            //    RequireUppercase = true,
            //};

            //var dataProtectionProvider = options.DataProtectionProvider;
            //if (dataProtectionProvider != null)
            //{
            //    manager.UserTokenProvider =
            //        new DataProtectorTokenProvider<ApplicationUser, Guid>(dataProtectionProvider.Create("ASP.NET Identity"));
            //}
            return manager;
        }
    }
    public class ApplicationSignInManager : SignInManager<ApplicationUser, Guid>
    {
        public ApplicationSignInManager(ApplicationUserManager userManager, IAuthenticationManager authenticationManager)
            : base(userManager, authenticationManager)
        {
        }

        public override Task<ClaimsIdentity> CreateUserIdentityAsync(ApplicationUser user)
        {
            return user.GenerateUserIdentityAsync((ApplicationUserManager)UserManager, user.UserName);
        }

        public static ApplicationSignInManager Create(IdentityFactoryOptions<ApplicationSignInManager> options, IOwinContext context)
        {
            return new ApplicationSignInManager(context.GetUserManager<ApplicationUserManager>(), context.Authentication);
        }
    }
}