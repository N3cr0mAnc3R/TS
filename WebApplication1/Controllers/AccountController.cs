using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Account;

namespace WebApplication1.Controllers
{
    public class AccountController : BaseController
    {
        public ActionResult Login()
        {
            return View();
        }
        // GET: Account
        [HttpPost]
        public async Task<ActionResult> Login(LoginModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    ApplicationUser user = await AccountManager.GetUser(model.Login, model.Password);
                    if (user.Uuid == Guid.Empty)
                        throw new Exception("Неверный логин или пароль");
                    AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
                    var identity = UserManager.CreateIdentity(user, DefaultAuthenticationTypes.ApplicationCookie);
                    AuthenticationManager.SignIn(new AuthenticationProperties() { IsPersistent = false }, identity);

                    return RedirectToAction("list", "auditory");
                }
                else
                {
                    ModelState.AddModelError("", "Неудачная попытка входа.");
                    return View(model);
                }

            }
            catch(Exception e)
            {
                ModelState.AddModelError("", e.Message);
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
        public ActionResult Logout(string returnUrl = null)
        {
            AuthenticationManager.SignOut();
            return Redirect(returnUrl);
        }
        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }
    }
}