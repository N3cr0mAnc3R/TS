using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Web;
using System.Web.Http;
using WebApp.Models;
using WebApp.Models.Account;

namespace WebApp.Controllers.Api
{
    public abstract class BaseApiController : ApiController
    {

        private ApplicationUserManager _userManager;
        private ApplicationSignInManager _signInManager;
        protected string GetCurrentDomain()
        {
            return Request.RequestUri.Authority;
        }

        public ApplicationUserManager UserManager
        {
            get
            {
                return _userManager ?? Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                _userManager = value;
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
                string Localization = "RU";
                return AccountManager.GetUser(((ClaimsIdentity)User.Identity).Claims.Select(a => a.Value).FirstOrDefault(), Localization, null);
            }
        }

        public IHttpActionResult WrapResponse(object data)
        {
            return Json(data);
        }
    }
}