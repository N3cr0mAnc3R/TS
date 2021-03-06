using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models.Administration;
using WebApp.Models.Common;
using WebApp.Models.Disciplines;
using WebApp.Models.UserTest;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/Administration")]
    public class AdministrationApiController : BaseApiController
    {

        [HttpPost]
        [Route("GetPeopleWithAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetPeopleWithAccess(int Id)
        {
            return WrapResponse(await AdministrationManager.GetPeopleWithAccess(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetPeopleWithReportAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetPeopleWithReportAccess(int Id)
        {
            return WrapResponse(await AdministrationManager.GetPeopleWithReportAccess(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("HasAccessToReport")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasAccessToReport(int Id)
        {
            return WrapResponse(await AdministrationManager.HasAccessToReport(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("HasFullAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasFullAccess()
        {
            return WrapResponse(await AdministrationManager.HasFullAccess(CurrentUser.Id));
        }
        [HttpPost]
        [Route("getAuditoryById")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetAuditoryById(int Id)
        {
            return WrapResponse(await AdministrationManager.GetAuditoryPlacesById(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("ResetStatus")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> ResetStatus(int Id)
        {
            try
            {
                await AdministrationManager.ResetStatus(CurrentUser.Id, Id);
                return WrapResponse(1);
            }
            catch (Exception exc)
            {
                return WrapResponse(exc.Message);
            }
        }
        [HttpPost]
        [Route("GetAuditoryList")]
        public async Task<IHttpActionResult> GetAuditoryList()
        {
            return WrapResponse(await AdministrationManager.GetAuditoryList(CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetUserAnswerLog")]
        public async Task<IHttpActionResult> GetUserAnswerLog(int Id)
        {
            return WrapResponse(await AdministrationManager.GetUserAnswerLog(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetDisciplines")]
        public async Task<IHttpActionResult> GetDisciplines()
        {
            return WrapResponse(await AdministrationManager.GetDisciplines());
        }
        [HttpPost]
        [Route("AssignDisciplineToUser")]
        public async Task<IHttpActionResult> AssignDisciplineToUser(AssignDisciplineModel model)
        {
            try
            {
                await AdministrationManager.AssignDisciplineToUser(model);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("DoubleNullified")]
        public async Task<IHttpActionResult> DoubleNullified(int Id)
        {
            try
            {
                await AdministrationManager.DoubleNullified(CurrentUser.Id, Id);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("ChangeTestingDate")]
        public async Task<IHttpActionResult> ChangeTestingDate(TestingModel model)
        {
            try
            {
                await AdministrationManager.ChangeTestingDate(CurrentUser.Id, model);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("HasAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasAccess(int url)
        {
            bool result = false;

            if (!HttpContext.Current.Request.IsAuthenticated)
            {
                return WrapResponse(result);
            }

            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();

            //1 - аудитории, 2 - Проверка, 3 - отчёты для админа, 4 - отчёты для комиссии
            switch (url)
            {
                case 1: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 4, 6, 7 })) result = true; break;
                case 2: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 7 })) result = true; break;
                case 3: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6, 7 })) result = true; break;
                case 5: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6, 7, 9 })) result = true; break;
                case 4: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 6, 7 })) result = true; break;
                default: break;
            }
            return WrapResponse(result);

        }
        [HttpPost]
        [Route("HasAccessToTestingProfile")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasAccessToAuditory(int Id)
        {
            return WrapResponse(await AdministrationManager.HasAccessToTestingProfile(CurrentUser.Id, Id));
        }

        [HttpPost]
        [Route("GetUserFamilyById")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetUserFamilyById(int Id)
        {
            return WrapResponse(await AdministrationManager.GetUserFamilyById(Id));
        }
        [HttpPost]
        [Route("GetDisciplineQuestions")]
        public async Task<IHttpActionResult> GetDisciplineQuestions(int Id, int Offset = 0, int Count = 100, int? IsActive = null)
        {
            return WrapResponse(await AdministrationManager.GetDisciplineQuestions(Id, Offset, Count, IsActive, CurrentUser.Id));
        }
        [HttpPost]
        [Route("ToggleQuestion")]
        public async Task<IHttpActionResult> ToggleQuestion(int Id, bool IsActive)
        {
            await AdministrationManager.ToggleQuestion(Id, IsActive, CurrentUser.Id);
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("GetQuestionCount")]
        public async Task<IHttpActionResult> GetQuestionCount(int Id, int? IsActive = null)
        {
            return WrapResponse(await AdministrationManager.GetQuestionCount(Id, IsActive, CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetTestingPassTimes")]
        public async Task<IHttpActionResult> GetTestingPassTimes()
        {
            return WrapResponse(await AdministrationManager.GetTestingPassTimes());
        }
        [HttpPost]
        [Route("CreateDiscipline")]
        public async Task<IHttpActionResult> CreateDiscipline(DisciplineModel model)
        {
            return WrapResponse(await AdministrationManager.CreateDiscipline(model));
        }
        [HttpPost]
        [Route("UpdateDiscipline")]
        public async Task<IHttpActionResult> UpdateDiscipline(DisciplineModel model)
        {
            await AdministrationManager.UpdateDiscipline(model);
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("GetQuestionCategories")]
        public async Task<IHttpActionResult> GetQuestionCategories(int Id)
        {
            return WrapResponse(await AdministrationManager.GetQuestionCategories(Id));
        }
        [HttpPost]
        [Route("GetQuestionThemes")]
        public async Task<IHttpActionResult> GetQuestionThemes(int Id)
        {
            return WrapResponse(await AdministrationManager.GetQuestionThemes(Id));
        }
        [HttpPost]
        [Route("GetStructureDiscipline")]
        public async Task<IHttpActionResult> GetStructureDiscipline(int Id, int? year = null)
        {
            return WrapResponse(await AdministrationManager.GetStructureDiscipline(Id, year));
        }
        [HttpPost]
        [Route("SaveQuestionCategory")]
        public async Task<IHttpActionResult> SaveQuestionCategory(CategoryQuestion model)
        {
            await AdministrationManager.SaveQuestionCategory(model);
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("SaveQuestionTheme")]
        public async Task<IHttpActionResult> SaveQuestionTheme(CategoryQuestion model)
        {
            await AdministrationManager.SaveQuestionTheme(model);
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("GetTestingTypes")]
        public async Task<IHttpActionResult> GetTestingTypes()
        {
            return WrapResponse(await AdministrationManager.GetTestingTypes());
        }
        [HttpPost]
        [Route("GetTestingAnswerTypes")]
        public async Task<IHttpActionResult> GetTestingAnswerTypes()
        {
            return WrapResponse(await AdministrationManager.GetTestingAnswerTypes());
        }
        [HttpPost]
        [Route("SaveQuestionString")]
        public async Task<IHttpActionResult> SaveQuestionString(QuestionUploadModel model)
        {
            string first = "<html><head></head><body>";
            string second = "</body></html>";
            try
            {
                model.Question = Cropper.Cropper.ConvertToWord(first + model.QuestionString + second);
                int Id = (int)(await AdministrationManager.SaveQuestionFile(model)).QuestionId;
                if (Id != 0)
                {
                    string file = Cropper.Cropper.CropImage(model.Question);
                    string img = Cropper.Cropper.CropImageWithFix(file);
                    await AdministrationManager.SaveQuestionImage(Id, img);

                }
                //string file = await AdministrationManager.GetQuestionImage(Id);
            }
            catch (Exception ex)
            {
                return WrapResponse(ex.Message);
            }
            return WrapResponse(true);
        }
        [HttpPost]
        [Route("FastUserLoad")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> FastUserLoad(Guid Id)
        {
            try
            {
                await AdministrationManager.FastUserLoad(Id);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("SetUserToReport")]
        [AllowAnonymous]
        public async Task<int> SetUserToReport(AccessModel model)
        {
            try
            {
                await AdministrationManager.SetUserToReport(CurrentUser.Id, model);
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        [HttpPost]
        [Route("SetUserToAuditory")]
        [AllowAnonymous]
        public async Task<int> SetUserToAuditory(AccessModel model)
        {
            try
            {
                await AdministrationManager.SetUserToAuditory(CurrentUser.Id, model);
                return 1;
            }
            catch
            {
                return 0;
            }
        }



        protected AdministrationManager AdministrationManager
        {
            get
            {
                return Request.GetOwinContext().Get<AdministrationManager>();
            }
        }
    }
}