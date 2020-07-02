using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.DirectoryServices.AccountManagement;
using System.DirectoryServices.Protocols;
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

        protected readonly string Domain = ConfigurationManager.AppSettings["ldap:server"];
        protected readonly string ServiceUserName = ConfigurationManager.AppSettings["ldap:userName"];
        protected readonly string ServicePassword = ConfigurationManager.AppSettings["ldap:password"];
        [AllowAnonymous]
        public ActionResult Login()
        {
            //SignInManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie);
            if (Request.IsAuthenticated)
            {
                return RedirectToAction("list", "auditory");
            }
            return View();

        }
        private ApplicationUser getLDAPuuid(LoginModel model)
        {
            PrincipalContext cnt = new PrincipalContext(ContextType.Domain, Domain, ServiceUserName, ServicePassword);
            string uuid = null;
            if (cnt.ValidateCredentials(model.Login, model.Password))
            {
                using (LdapConnection ldapConnection = new LdapConnection(Domain))
                {
                    ldapConnection.Credential = new NetworkCredential(ServiceUserName, ServicePassword);
                    ldapConnection.Bind();

                    var attr = new string[] { "ncfuGUID" };
                    var request = new SearchRequest("OU=Пользователи,DC=ncfu,DC=net", string.Format("(&(objectClass=user)(sAMAccountName={0}))", model.Login), System.DirectoryServices.Protocols.SearchScope.Subtree, attr);
                    var dr = (SearchResponse)ldapConnection.SendRequest(request);
                    if (dr.Entries.Count > 0)
                    {
                        uuid = dr.Entries[0].Attributes["ncfuGUID"].GetValues(typeof(string)).First().ToString();
                    }
                }
            }
            return uuid == null ? null : AccountManager.GetUser(new Guid(uuid));
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
        public async Task<JsonResult> HasAccess(int url)
        {
            bool result = false;

            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();

            //1 - аудитории, 2 - Проверка, 3 - отчёты для админа, 4 - отчёты для комиссии
            switch (url)
            {
                case 1: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 4, 6, 7 })) result = true; break;
                case 2: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1,2,3,4,7 })) result = true; break;
                case 3: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6,7 })) result = true; break;
                case 4: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 6, 7 })) result = true; break;
                default: break;
            }
            return Json(result);

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

                ApplicationUser user = null;
                user = getLDAPuuid(model);
                if (user == null)
                {
                    user = AccountManager.GetUser(model.Login, null, model.Password);
                }
                if (user.Id == Guid.Empty)
                {
                    ModelState.AddModelError("", "Неверный логин или пароль");
                    return View(model);
                }

               // await AccountManager.LoadNewUserIfNotExists(user.Id);


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
            return Json(new { PictureImage = CurrentUser.PictureImage });
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