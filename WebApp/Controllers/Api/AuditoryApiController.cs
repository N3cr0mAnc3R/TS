using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models;
using WebApp.Models.Common;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/auditory")]
    public class AuditoryApiController : BaseApiController
    {
        [HttpPost]
        [Route("GetOrganizationContacts")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetOrganizationContacts()
        {
            return WrapResponse(await AuditoryManager.GetOrganizationContacts());
        }
        [HttpPost]
        [Route("GetAuditoryList")]
        public async Task<IHttpActionResult> GetAuditoryList()
        {
            return WrapResponse(await AuditoryManager.GetAuditoryList(CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetAuditoryInfo")]
        public async Task<IHttpActionResult> GetAuditoryInfo(int Id)
        {
            return WrapResponse(await AuditoryManager.GetAuditoryById(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetUserInfo")]
        public async Task<IHttpActionResult> GetUserInfo(int Id)
        {
            return WrapResponse(await AuditoryManager.GetUserInfo(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("UpdateStatus")]
        public async Task<IHttpActionResult> UpdateStatus(int Id, int StatusId)
        {
            try
            {
                return WrapResponse(await AuditoryManager.UpdateStatus(Id, StatusId, CurrentUser.Id));
            }
            catch (Exception e)
            {
                return WrapResponse(new { Error = e.Message });
            }
        }
        [HttpPost]
        [Route("GetAuditoryInfoForModerate")]
        public async Task<IHttpActionResult> GetAuditoryInfoForModerate(int Id)
        {
            return WrapResponse(await AuditoryManager.GetAuditoryByIdForModerate(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetInfoAboutPlace")]
        public async Task<IHttpActionResult> GetInfoAboutPlace(int Id)
        {
            return WrapResponse(await AuditoryManager.GetInfoAboutPlace(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetPlaceByProfile")]
        public async Task<IHttpActionResult> GetPlaceByProfile(int Id)
        {
            return WrapResponse(await AuditoryManager.GetPlaceByProfile(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetTimes")]
        public async Task<IHttpActionResult> GetTimes()
        {
            return WrapResponse(await AuditoryManager.GetTimes());
        }
        [HttpPost]
        [Route("GetUserWithTimes")]
        public async Task<IHttpActionResult> GetUserWithTimes(ScheduleModel model)
        {
            return WrapResponse(await AuditoryManager.GetUserWithTimes(model.Id, CurrentUser.Id, model.Date));
        }
        [HttpPost]
        [Route("SetPlaceFree")]
        public async Task<IHttpActionResult> SetPlaceFree(int Id)
        {
            try
            {
                await AuditoryManager.SetPlaceFree(Id, CurrentUser.Id);
                return WrapResponse(1);
            }
            catch (Exception e)
            {
                return WrapResponse(new { error = e.Message });
            }
        }
        [HttpPost]
        [Route("GetAuditoryStatistic")]
        public async Task<IHttpActionResult> GetAuditoryStatistic(int Id)
        {
            return WrapResponse(await AuditoryManager.GetAuditoryStatistic(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("ResetTest")]
        public async Task<IHttpActionResult> ResetTest(int Id)
        {
            if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
            {
                await AuditoryManager.ResetTest(Id);
                return WrapResponse(1);
            }
            else
            {
                return WrapResponse("Мечтай");
            }
        }
        [HttpPost]
        [Route("FinishTest")]
        public async Task<IHttpActionResult> FinishTest(int Id)
        {
            if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
            {
                await TestManager.FinishTest(Id, CurrentUser.Id);
                return Json(1);
            }
            else
            {
                return WrapResponse("Мечтай");
            }
        }
        [HttpPost]
        [Route("DeletePreliminary")]
        public async Task<IHttpActionResult> DeletePreliminary(int Id)
        {
            if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
            {
                await AuditoryManager.DeletePreliminary(Id);
                return WrapResponse(1);
            }
            else
            {
                return WrapResponse("Мечтай");
            }
        }
        [HttpPost]
        [Route("GetInfoForAdmin")]
        public async Task<IHttpActionResult> GetInfoForAdmin(int Id)
        {
            if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
            {
                return WrapResponse(await AuditoryManager.GetInfoForAdmin(Id, CurrentUser.Id));
            }
            else
            {
                return WrapResponse("Мечтай");
            }
        }
        [HttpPost]
        [Route("GetNewPeople")]
        public async Task<IHttpActionResult> GetNewPeople(int Id)
        {
            try
            {
                await AuditoryManager.GetNewPeople(Id, CurrentUser.Id);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("GetUsersByDate")]
        public async Task<IHttpActionResult> GetUsersByDate(TestUserModel model)
        {
            if (model.Id != 0) return WrapResponse(await AuditoryManager.GetUsersByDateAud(model.Id, model.StatusId, model.Date, CurrentUser.Id));
            return WrapResponse(await AuditoryManager.GetUsersResultByDate(model.StatusId, model.Auditory, model.Date, CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetStatuses")]
        public async Task<IHttpActionResult> GetStatuses()
        {
            return WrapResponse(await AuditoryManager.GetStatuses(CurrentUser.Id));
        }
        [HttpPost]
        [Route("UpdateAuditoryInfo")]
        public async Task<IHttpActionResult> UpdateAuditoryInfo(Auditory auditory)
        {
            try
            {
                if (auditory != null)
                {
                    await AuditoryManager.UpdatePlaces(auditory, CurrentUser.Id);
                    return WrapResponse(await AuditoryManager.GetAuditoryById(CurrentUser.Id, auditory.Id));
                }
                return WrapResponse(new { Error = "Ошибка соединения" });
            }
            catch (Exception e)
            {
                return WrapResponse(new { Error = e.Message });
            }
        }
        [HttpPost]
        [Route("GenerateConfiguration")]
        public async Task<IHttpActionResult> GenerateConfiguration(Auditory auditory)
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
            return WrapResponse(auditory);
        }
        [HttpPost]
        [Route("GetAuditoryCompsWithoutPin")]
        public async Task<IHttpActionResult> GetAuditoryCompsWithoutPin(int Id)
        {
            return WrapResponse(await AuditoryManager.GetAuditoryCompsWithoutPin(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("ResetPins")]
        public async Task ResetPins(int Id)
        {
            await AuditoryManager.ResetPins(Id, CurrentUser.Id);
        }
        [HttpPost]
        [Route("GetUserPicture")]
        public async Task<string> GetUserPicture(int Id)
        {
            return (await AuditoryManager.GetUserPicture(Id, CurrentUser.Id)).PictureImage;
        }
        bool IsPinBusy(int pin, List<TestComputer> computers)
        {
            bool result = false;
            computers.ForEach(a => result = (a.PIN == pin) ? true : result);
            return result;
        }
        [HttpPost]
        [Route("UpdatePlaceConfig")]
        public async Task<IHttpActionResult> UpdatePlaceConfig(PlaceConfigModel model)
        {
            await AuditoryManager.UpdatePlaceConfig(model, CurrentUser.Id);
            return WrapResponse(true);
        }

        [Route("DownloadFile")]
        public async Task<IHttpActionResult> DownloadFile(Guid? Id)
        {
            //FileStreamDownload dwnl = TestManager.DownloadFileById(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
            //return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
            return WrapResponse(await TestManager.DownloadFileById(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)));
        }
        [HttpPost]
        [Route("SetUserVerified")]
        public async Task<IHttpActionResult> SetUserVerified(VerifyModel model)
        {
            await AuditoryManager.SetUserVerified(model.Id, model.Verified, CurrentUser.Id);
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("GetProfileByPlaceConfig")]
        public async Task<IHttpActionResult> GetProfileByPlaceConfig(string placeConfig)
        {
            return WrapResponse(await AuditoryManager.GetProfileByPlaceConfig(placeConfig, (CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetPlaceConfig")]
        public async Task<IHttpActionResult> GetPlaceConfig(int pin)
        {
            return WrapResponse(await AuditoryManager.GetPlaceConfig(pin, (CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
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