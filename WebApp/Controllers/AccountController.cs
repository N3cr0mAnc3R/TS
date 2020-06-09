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
            if (CurrentUser == null) return Json(false);
            else
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
        public async Task<ActionResult> Login(LoginModel model)
        {
            if (ModelState.IsValid)
            {
                ApplicationUser user = AccountManager.GetUser(model.Login, null, model.Password);
                if (user.Id == Guid.Empty)
                {
                    ModelState.AddModelError("", "Неверный логин или пароль");
                    return View(model);
                }

                SignInManager.SignIn(user, false, false);


                List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
                if (AccountManager.HasOneOfRoles(roles, new int[4] { 1,2,3,4}))
                {
                    return RedirectToAction("list", "verification");
                }
                else if (AccountManager.HasOneOfRoles(roles, new int[2] { 6, 7 }))
                {
                    return RedirectToAction("list", "auditory");
                }
                else
                {
                    ViewBag.PlaceInfo = await AuditoryManager.GetFreePlaces(user.Id);
                    return RedirectToAction("waiting", "user");
                }
            }
            else
            {
                ModelState.AddModelError("", "Неудачная попытка входа.");
                return View(model);
            }

        }

        [HttpPost]
        public JsonResult GetCurrentUser()
        {
            return Json(CurrentUser);
        }

#if DEBUG
        [HttpPost]
        public JsonResult GetDomain()
        {
            return Json("ws://localhost");
        }
#else
        [HttpPost]
        public JsonResult GetDomain()
        {
            return Json("wss://de.ncfu.ru");
        }
#endif


        public ActionResult UserPic()
        {
            var result = File(CurrentUser.Picture, "image/jpg");
            return result;
            return CurrentUser.Picture != null ? File(CurrentUser.Picture, "image/jpg") : (ActionResult)new HttpStatusCodeResult(404);
        }

        protected AccountManager AccountManager
        {
            get
            {
                return Request.GetOwinContext().Get<AccountManager>();
            }
        }
        protected AuditoryManager AuditoryManager
        {
            get
            {
                return Request.GetOwinContext().Get<AuditoryManager>();
            }
        }
    }
}