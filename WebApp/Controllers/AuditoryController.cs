using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Account;
using WebApp.Models.Common;

namespace WebApp.Controllers
{
    public class AuditoryController : BaseController
    {
        public async Task<ActionResult> List()
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[2] { 6, 7 }))
            {
                return View();
            }
            else if (AccountManager.HasOneOfRoles(roles, new int[4] { 1, 2, 3, 4 }))
            {
                return Redirect("/Verification/List");
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }
        public async Task<ActionResult> Index(int Id)
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[2] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }
        public async Task<ActionResult> Moderate(int Id)
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[2] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }
        async public Task<ActionResult> DownloadReport(int Id)
        {
            TestUser t = await AuditoryManager.GetInfoForReport(Id, CurrentUser.Id);
            if(t == null)
            {
                return JavaScript("window.close();");
            }
            ReportList report = await AuditoryManager.GetResultReport(CurrentUser.Id);
            ReportRender render = new ReportRender(
            "http://reports.ncfu.ru/ReportServer",
            "/TestingSystem/TestingResult",
            "ecampus",
            "44xwkm8y8c",
            "st9-dbe-reports");

            FileContentResult result = File(render.Render("pdf", new { testingProfileId = Id }), "pdf");

            result.FileDownloadName = t.LastName + " " + t.FirstName + " " + t.MiddleName + ".pdf";

            return result;

        }
        public ActionResult DownloadVideoFile(int Id, int Type)
        {
            FileStreamDownload dwnl = TestManager.FileDownload(Id, Type, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
            return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
        }
        public JsonResult DownloadFile(Guid? Id)
        {
            //FileStreamDownload dwnl = TestManager.DownloadFileById(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
            //return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
            return Json(TestManager.DownloadFileById(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)));
        }
        [HttpPost]
        public async Task<JsonResult> GetAuditoryInfo(int Id)
        {
            return Json(await AuditoryManager.GetAuditoryById(CurrentUser.Id, Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetAuditoryInfoForModerate(int Id)
        {
            return Json(await AuditoryManager.GetAuditoryByIdForModerate(CurrentUser.Id, Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetAuditoryList()
        {
            return Json(await AuditoryManager.GetAuditoryList(CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetAuditoryStatistic(int Id)
        {
            return Json(await AuditoryManager.GetAuditoryStatistic(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetNewPeople()
        {
            return Json(await AuditoryManager.GetNewPeople(CurrentUser.Id));
        }
        [HttpPost]
        public async Task<JsonResult> GetUsersByDate(TestUserModel model)
        {
            if (model.Id != 0) return Json(await AuditoryManager.GetUsersByDateAud(model.Id, model.StatusId, model.Date, CurrentUser.Id, Session["Localization"].ToString()));
            return Json(await AuditoryManager.GetUsersResultByDate(model.StatusId, model.Date, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> GetStatuses()
        {
            return Json(await AuditoryManager.GetStatuses(CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task<JsonResult> UpdateAuditoryInfo(Auditory auditory)
        {
            try
            {
                if (auditory != null)
                {
                    await AuditoryManager.UpdatePlaces(auditory, CurrentUser.Id);
                    return Json(await AuditoryManager.GetAuditoryById(CurrentUser.Id, auditory.Id, Session["Localization"].ToString()));
                }
                return Json(new { Error = "Ошибка соединения" });
            }
            catch (Exception e)
            {
                return Json(new { Error = e.Message });
            }
        }
        [HttpPost]
        public async Task<JsonResult> GenerateConfiguration(Auditory auditory)
        {
            if (auditory != null)
            {
                Random random = new Random();
                foreach (var computer in auditory.ComputerList)
                {
                    int pin = random.Next(1000, 10000);
                    while (IsPinBusy(pin, auditory.ComputerList.ToList()))
                    {
                        pin = random.Next(1000, 10000);
                    }
                    computer.PIN = pin;
                }
                await AuditoryManager.UpdatePlacesConfig(auditory, CurrentUser.Id);
            }
            return Json(auditory);
        }
        [HttpPost]
        public async Task<JsonResult> GetAuditoryCompsWithoutPin(int Id)
        {
            return Json(await AuditoryManager.GetAuditoryCompsWithoutPin(Id, CurrentUser.Id, Session["Localization"].ToString()));
        }
        [HttpPost]
        public async Task ResetPins(int Id)
        {
            await AuditoryManager.ResetPins(Id, CurrentUser.Id);
        }
        [HttpPost]
        public async Task<JsonResult> GetUserPicture(int Id)
        {
            return Json(Convert.ToBase64String((await AuditoryManager.GetUserPicture(Id, CurrentUser.Id)).Picture));
        }
        bool IsPinBusy(int pin, List<TestComputer> computers)
        {
            bool result = false;
            computers.ForEach(a => result = (a.PIN == pin) ? true : result);
            return result;
        }

        [HttpPost]
        public async Task<JsonResult> UpdatePlaceConfig(PlaceConfigModel model)
        {
            await AuditoryManager.UpdatePlaceConfig(model, CurrentUser.Id);
            return Json(true);
        }
        [HttpPost]
        public async Task<JsonResult> SetUserVerified(VerifyModel model)
        {
            await AuditoryManager.SetUserVerified(model.Id, model.Verified, CurrentUser.Id);
            return Json(true);
        }
        [HttpPost]
        public async Task<JsonResult> GetProfileByPlaceConfig(string placeConfig)
        {
            return Json(await AuditoryManager.GetProfileByPlaceConfig(placeConfig, (CurrentUser == null) ? (Guid?)null : CurrentUser.Id, Session["Localization"].ToString()));
        }

        [HttpPost]
        public async Task<JsonResult> GetPlaceConfig(int pin)
        {
            return Json(await AuditoryManager.GetPlaceConfig(pin, (CurrentUser == null) ? (Guid?)null : CurrentUser.Id, Session["Localization"].ToString()));
        }

        protected AuditoryManager AuditoryManager
        {
            get
            {
                return Request.GetOwinContext().Get<AuditoryManager>();

            }
        }
        protected TestManager TestManager
        {
            get
            {
                return Request.GetOwinContext().Get<TestManager>();

            }
        }
    }
}