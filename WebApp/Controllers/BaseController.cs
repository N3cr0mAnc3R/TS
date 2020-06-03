using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Account;

namespace WebApp.Controllers
{
    public class BaseController : Controller
    {
        private ApplicationUserManager _userManager;
        private ApplicationSignInManager _signInManager;

        public ApplicationUserManager UserManager
        {
            get
            {
                return _userManager ?? HttpContext.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                _userManager = value;
            }
        }

        public ApplicationSignInManager SignInManager
        {
            get
            {
                return _signInManager ?? HttpContext.GetOwinContext().Get<ApplicationSignInManager>();
            }
            private set
            {
                _signInManager = value;
            }
        }
        protected AccountManager AccountManager
        {
            get
            {
                return Request.GetOwinContext().Get<AccountManager>();
            }
        }
        public ApplicationUser CurrentUser
        {
            get
            {
                string Localization = (Session["Localization"] == null) ? null : Session["Localization"].ToString();
                return AccountManager.GetUser(((ClaimsIdentity)User.Identity).Claims.Select( a => a.Value).FirstOrDefault(), Localization, null);
            }
        }
    }
}