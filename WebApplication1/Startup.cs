using Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebApplication1.Models;

namespace WebApplication1
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.CreatePerOwinContext<Concrete>(CreateConcrete);
            ConfigureAuth(app);
            DomainConfiguration(app);
        }
    }
}