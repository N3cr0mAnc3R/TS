using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebApplication1.Models.Account;

namespace WebApplication1.Models
{
    public class BaseController : Controller
    {
        public ApplicationUser CurrentUser
        {
            get
            {
                if (!Request.IsAuthenticated) return null;
                return UserManager.FindByName(User.Identity.Name);
            }
        }
        private ApplicationUserManager userManager;
        protected ApplicationUserManager UserManager
        {
            get
            {
                if (userManager == null)
                {
                    userManager = new ApplicationUserManager(new UserStore());
                }
                return userManager;
            }
            set
            {
                userManager = value;
            }
        }
        // GET: Base
        public ActionResult Index()
        {
            return View();
        }
    }
}