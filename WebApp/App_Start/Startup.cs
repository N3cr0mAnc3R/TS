using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Owin;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using WebApp.Models;
using WebApp.Models.Account;
using WebApp.Models.Administration;
using WebApp.Models.Logs;
using WebApp.Models.Proctoring;

namespace WebApp
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.CreatePerOwinContext<Concrete>(CreateConcrete);
            ConfigureAuth(app);
        }
        public void ConfigureAuth(IAppBuilder app)
        {
            app.CreatePerOwinContext(ApplicationDbContext.Create);
            app.CreatePerOwinContext<ApplicationUserManager>(ApplicationUserManager.Create);
            app.CreatePerOwinContext<ApplicationSignInManager>(ApplicationSignInManager.Create);

            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = DefaultAuthenticationTypes.ApplicationCookie,
                LoginPath = new PathString("/Account/Login"),
                CookieName = "DE",
                Provider = new CookieAuthenticationProvider
                {
                    // Позволяет приложению проверять метку безопасности при входе пользователя.
                    // Эта функция безопасности используется, когда вы меняете пароль или добавляете внешнее имя входа в свою учетную запись.  
                    //OnValidateIdentity = SecurityStampValidator.OnValidateIdentity<ApplicationUserManager, ApplicationUser>(
                    //   validateInterval: TimeSpan.FromMinutes(30)
                    //   , regenerateIdentity: (manager, user) => user.GenerateUserIdentityAsync(manager)
                    //   )
                }
            });
            app.CreatePerOwinContext<AccountManager>((IdentityFactoryOptions<AccountManager> options, IOwinContext context) =>
            {
                return new AccountManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<AuditoryManager> options, IOwinContext context) =>
            {
                return new AuditoryManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<TestManager> options, IOwinContext context) =>
            {
                return new TestManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<ProctorManager> options, IOwinContext context) =>
            {
                return new ProctorManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<LogManager> options, IOwinContext context) =>
            {
                return new LogManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<StatisticManager> options, IOwinContext context) =>
            {
                return new StatisticManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<AdministrationManager> options, IOwinContext context) =>
            {
                return new AdministrationManager(context.Get<Concrete>());
            });
        }

        public Concrete CreateConcrete(IdentityFactoryOptions<Concrete> options, IOwinContext context)
        {
            return new Concrete(ConfigurationManager.ConnectionStrings["Testing"]);
        }
    }
}