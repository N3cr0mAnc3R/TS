using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Account;

namespace WebApp.Controllers
{
    public class AccountController : BaseController
    {
        [AllowAnonymous]
        public ActionResult Login()
        {
            //SignInManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
            return View();

        }
        [AllowAnonymous]
        public JsonResult IsAuthenticated()
        {
            //SignInManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
            return Json(CurrentUser.Id != Guid.Empty);

        }
        [AllowAnonymous]
        public ActionResult Logout()
        {

            Request.GetOwinContext().Authentication.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
            return RedirectToAction("list", "auditory");
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Login(LoginModel model)
        {
            if (ModelState.IsValid)
            {
                ApplicationUser user = AccountManager.GetUser(model.Login, model.Password);
                if (user.Id == Guid.Empty)
                    throw new Exception("Неверный логин или пароль");

                SignInManager.SignIn(user, false, false);

                return RedirectToAction("list", "auditory");
            }
            else
            {
                ModelState.AddModelError("", "Неудачная попытка входа.");
                return View(model);
            }

        }

        protected AccountManager AccountManager
        {
            get
            {
                return Request.GetOwinContext().Get<AccountManager>();
            }
        }
    }
}