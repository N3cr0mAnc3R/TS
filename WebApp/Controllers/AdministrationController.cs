using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models.Account;
using WebApp.Models.Administration;

namespace WebApp.Controllers
{
    public class AdministrationController : BaseController
    {
        // GET: Administration
        public async Task<ActionResult> Index()
        {
            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }

        protected AdministrationManager AdministrationManager
        {
            get
            {
                return Request.GetOwinContext().Get<AdministrationManager>();
            }
        }
    }
}