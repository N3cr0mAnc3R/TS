using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin;
using Owin;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using WebApplication1.Models;
using WebApplication1.Models.Account;

namespace WebApplication1
{
    public partial class Startup
    {
        public void DomainConfiguration(IAppBuilder app)
        {

            app.CreatePerOwinContext((IdentityFactoryOptions<TestManager> options, IOwinContext context) =>
            {
                return new TestManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<AuditoryManager> options, IOwinContext context) =>
            {
                return new AuditoryManager(context.Get<Concrete>());
            });
            app.CreatePerOwinContext((IdentityFactoryOptions<AccountManager> options, IOwinContext context) =>
            {
                return new AccountManager(context.Get<Concrete>());
            });





        }
        /// <summary>
        /// Имя строки соединения с БД
        /// </summary>
        public string ConnectionName
        {
            get
            {
                return ConfigurationManager.AppSettings["sys:connectionName"];
            }
        }

        /// <summary>
        /// Метод возвращает строку соединения по умолчанию
        /// </summary>
        /// <returns>Объект строки соединения</returns>
        public ConnectionStringSettings GetConnectionStringSettings()
        {
            return ConfigurationManager.ConnectionStrings[ConnectionName];
        }

        /// <summary>
        /// Создает объект управления подключением к БД
        /// </summary>
        public Concrete CreateConcrete(IdentityFactoryOptions<Concrete> options, IOwinContext context)
        {
            return new Concrete(GetConnectionStringSettings());
        }
    }
}