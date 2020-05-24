using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models.Proctoring;

namespace WebApp.Controllers
{
    public class VerificationController : BaseController
    {
        // GET: Verification
        /// <summary>
        /// Доступные профили и тесты
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public async Task<ActionResult> List()
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[5] { 1, 2, 3, 4, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }
        /// <summary>
        /// Собственно страница, где комиссия проверяет челика
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public async Task<ActionResult> Index(int Id)
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[5] { 1, 2, 3, 4, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }


        [HttpPost]
        public async Task<JsonResult> GetProctorProfiles()
        {
            return Json(await ProctorManager.GetProctorProfiles(CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetCurrentUser(int TestingProfileId)
        {
            return Json(await ProctorManager.GetProctorInfo(TestingProfileId, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetMaxScore(int Id)
        {
            return Json(await ProctorManager.GetMaxScore(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> IsAvailable(int Id)
        {
            return Json(await ProctorManager.IsVerificationAvailable(CurrentUser.Id, Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetProctorTests(int Id)
        {
            return Json(await ProctorManager.GetProctorTests(CurrentUser.Id, Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetMembers(int Id)
        {
            return Json(await ProctorManager.GetProctorUserMembers(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetInfoAboutAnswer(int Id)
        {
            return Json(await ProctorManager.GetInfoAboutAnswer(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetInfoAboutVerification(int Id)
        {
            return Json(await ProctorManager.GetInfoAboutVerification(CurrentUser.Id, Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task SaveInfoAboutAnswer(SaveMarkModel model)
        {
            await ProctorManager.SaveInfoAboutAnswer(CurrentUser.Id, model, Session["Localization"].ToString());
        }
        [HttpPost]
        public async Task<JsonResult> GetInfoAboutTest(int Id)
        {
            return Json(await ProctorManager.GetInfoAboutTest(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task SaveInfoAboutTest(SaveMarkModel model)
        {
            await ProctorManager.SaveInfoAboutTest(CurrentUser.Id, model, Session["Localization"].ToString());
        }
        [HttpPost]
        public async Task SaveMark(SaveMarkModel model)
        {
            await ProctorManager.SaveMark(CurrentUser.Id, model, Session["Localization"].ToString());
        }
        [HttpPost]
        public async Task<JsonResult> GetMark(int Id)
        {
            return Json(await ProctorManager.GetMark(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }

        protected ProctorManager ProctorManager
        {
            get
            {
                return Request.GetOwinContext().Get<ProctorManager>();
            }
        }
    }
}