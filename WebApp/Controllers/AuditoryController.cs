using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Common;

namespace WebApp.Controllers
{
    public class AuditoryController : BaseController
    {
        public ActionResult List()
        {
            return View();
        }
        public ActionResult Index(int Id)
        {
            return View();
        }
        public ActionResult Moderate(int Id)
        {
            return View();
        }
        public ActionResult DownloadVideoFile(int Id, int Type)
        {
            FileStreamDownload dwnl = TestManager.FileDownload(Id, Type, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
            return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
        }
        [HttpPost]
        public JsonResult GetAuditoryInfo(int Id)
        {
            return Json(AuditoryManager.GetAuditoryById(CurrentUser.Id, Id));
        }
        [HttpPost]
        public JsonResult GetAuditoryInfoForModerate(int Id)
        {
            return Json(AuditoryManager.GetAuditoryByIdForModerate(CurrentUser.Id, Id));
        }
        [HttpPost]
        public JsonResult GetAuditoryList()
        {
            return Json(AuditoryManager.GetAuditoryList(CurrentUser.Id));
        }
        [HttpPost]
        public JsonResult UpdateAuditoryInfo(Auditory auditory)
        {
            try
            {
                if (auditory != null)
                {
                    AuditoryManager.UpdatePlaces(auditory, CurrentUser.Id);
                    return Json(AuditoryManager.GetAuditoryById(CurrentUser.Id, auditory.Id));
                }
                return Json(new { Error = "Ошибка соединения" });
            }
            catch(Exception e)
            {
                return Json(new { Error = e.Message });
            }
        }
        [HttpPost]
        public JsonResult GenerateConfiguration(Auditory auditory)
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
                AuditoryManager.UpdatePlacesConfig(auditory, CurrentUser.Id);
            }
            return Json(auditory);
        }
        bool IsPinBusy(int pin, List<TestComputer> computers)
        {
            bool result = false;
            computers.ForEach(a => result = (a.PIN == pin) ? true : result);
            return result;
        }

        [HttpPost]
        public JsonResult UpdatePlaceConfig(PlaceConfigModel model)
        {
            AuditoryManager.UpdatePlaceConfig(model, CurrentUser.Id);
            return Json(true);
        }
        [HttpPost]
        public async Task<JsonResult> GetProfileByPlaceConfig(string placeConfig)
        {
            return Json(await AuditoryManager.GetProfileByPlaceConfig(placeConfig, CurrentUser.Id));
        }

        [HttpPost]
        public JsonResult GetPlaceConfig(int pin)
        {
            return Json(AuditoryManager.GetPlaceConfig(pin, CurrentUser.Id));
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