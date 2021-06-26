using MessagingToolkit.QRCode.Codec;
using Microsoft.AspNet.Identity.Owin;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models;
using WebApp.Models.Common;
using WebApp.Models.Logs;
using WebApp.Models.Proctoring;
using WebApp.Models.UserTest;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/user")]
    public class UserApiController : BaseApiController
    {

        [HttpPost]
        [Route("TryVerify")]
        public async Task<IHttpActionResult> TryVerify(ForRecogn model)
        {
            await AuditoryManager.SetUserVerified(model.Id, true, CurrentUser.Id);
            return WrapResponse(true);

        }
        [Route("gettests")]
        [HttpPost]
        public async Task<IHttpActionResult> GetTests(string PlaceConfig)
        {
            try
            {
                List<TestingModel> tests = await TestManager.GetTestsByPlaceConfig(PlaceConfig, CurrentUser.Id);
                tests.AddRange(await TestManager.GetActiveTestsByPlaceConfig(PlaceConfig, CurrentUser.Id));
                return WrapResponse(tests);
            }
            catch (Exception e)
            {
                return WrapResponse(new { Error = e.Message });
            }
        }
        [Route("SaveError")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<IHttpActionResult> SaveError(ErrorModel Error)
        {
            try
            {
                await TestManager.SaveError(Error.Content, Error.TestingProfileId);
                return WrapResponse(new { Content = "Ошибка сохранена" });
            }
            catch (Exception e)
            {
                return WrapResponse(new { Error = e.Message });
            }
        }
        [Route("gettestsforuser")]
        [HttpPost]
        public async Task<IHttpActionResult> GetTestsForUser()
        {
            try
            {
                List<TestingModel> tests = await TestManager.GetTestsByUserId(CurrentUser.Id);
                tests.AddRange(await TestManager.GetActiveTestsByPlaceConfig(CurrentUser.Id));
                return WrapResponse(tests);
            }
            catch (Exception e)
            {
                return WrapResponse(new { Error = e.Message });
            }
        }
        [Route("CheckPIN")]
        [HttpPost]
        public async Task<IHttpActionResult> CheckPIN(int pin)
        {
            return WrapResponse(TestManager.CheckPIN(pin));
        }

        #region process
        [HttpPost]
        [Route("PauseTest")]
        public async Task PauseTest(int Id, string Localization)
        {
            await TestManager.ToggleTimer(Id, 1, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id), Localization);
        }
        [HttpPost]
        [Route("GetUserErrors")]
        public async Task<IHttpActionResult> GetUserErrors(int Id)
        {
            return WrapResponse(await TestManager.GetUserErrors(Id, (CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        }
        [HttpPost]
        [Route("SetUserErrors")]
        public async Task<IHttpActionResult> SetUserErrors(int Id, int Type)
        {
            return WrapResponse(await TestManager.SetUserErrors(Id, Type, (CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        }
        [HttpPost]
        [Route("GetErrorTypes")]
        public async Task<IHttpActionResult> GetErrorTypes()
        {
            return WrapResponse(await TestManager.GetErrorTypes((CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        }
        [HttpPost]
        [Route("GetUserAnswer")]
        public async Task<string> GetUserAnswer(Guid Id)
        {
            return await TestManager.GetUserAnswer(Id, CurrentUser.Id);
        }
        [HttpPost]
        [Route("GetAnswerImage")]
        public async Task<IHttpActionResult> GetAnswerImage(int Id)
        {
            AnswerModel model = (await TestManager.GetAnswerImage(Id)).First();
            model.AnswerImage = Cropper.Cropper.CropImageWithFix(model.AnswerImage);
            return WrapResponse(model);
        }
        [HttpPost]
        [Route("GetQuestionImage")]
        public async Task<string> GetQuestionImage(int Id, int Type = 1, int Part = 1)
        {
            QuestionModel model = (await TestManager.GetQuestionImage(Id)).First();
            if (Type != 4)
            {
                model.QuestionImage = Cropper.Cropper.CropImageWithFix(model.QuestionImage);
            }
            int Partition = 1200000;
            int left = model.QuestionImage.Length - (Part * Partition);
            if (left < Partition)
            {
                model.QuestionImage = model.QuestionImage.Substring((Part - 1) * Partition);
            }
            else
            {
                model.QuestionImage = "flag" + model.QuestionImage.Substring((Part - 1) * Partition, Partition);
            }
            return model.QuestionImage;
        }
        [Route("UpdateQuestionAnswer")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<IHttpActionResult> UpdateQuestionAnswer(UpdateAnswerModel model)
        {
            await TestManager.UpdateQuestionAnswer(model.answers);
            await LogManager.SaveLog(CurrentUser.Id, HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"], ActionType.User_SaveAnswer);
            return WrapResponse(true);
        }
        [Route("UpdateQuestionAnswer1")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<IHttpActionResult> UpdateQuestionAnswer1(UpdateAnswerModel model)
        {
            if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
            {
                await TestManager.UpdateQuestionAnswer1(model.answers, CurrentUser.Id);
                await LogManager.SaveLog(CurrentUser.Id, HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"], ActionType.User_SaveAnswer);
                return WrapResponse(true);
            }
            else
            {
                return WrapResponse("Мечтай");
            }
        }
        [HttpPost]
        [Route("GetFreePlaces")]
        public async Task<IHttpActionResult> GetFreePlaces()
        {
            return WrapResponse(await AuditoryManager.GetFreePlaces((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));

        }
        public class UpdateAnswerModel
        {
            public IEnumerable<QuestionAnswer> answers { get; set; }
        }
        [Route("GetSecurity")]
        [HttpPost]
        public async Task<IHttpActionResult> GetSecurity(int Id, string PlaceConfig)
        {
            bool HasAccess = await TestManager.GetSecurity(Id, (Guid?)null, PlaceConfig);
            return WrapResponse(new { HasAccess });
        }
        [HttpPost]
        [Route("GetTestAnswersById")]
        public async Task<IHttpActionResult> GetTestAnswersById(int Id)
        {
            return WrapResponse(await TestManager.GetTestAnswersById(Id));
        }
        [HttpPost]
        [Route("GetTestQuestionsById")]
        public async Task<IHttpActionResult> GetTestQuestionsById(int Id)
        {
            return WrapResponse(await TestManager.GetTestQuestionsById(Id));
        }

        [HttpPost]
        [Route("GetCurrentUser")]
        public async Task<IHttpActionResult> GetCurrentUser(int Id)
        {
            return WrapResponse(await TestManager.GetUserInfoByTestingProfile(Id));
        }
        [HttpPost]
        [Route("GetSourceMaterial")]
        public async Task<string> GetSourceMaterial(int Id)
        {
            return await TestManager.GetSourceMaterial(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null);
        }
        [HttpPost]
        [Route("GetSourceMaterials")]
        public async Task<IHttpActionResult> GetSourceMaterials(int Id)
        {
            return WrapResponse(await TestManager.GetSourceMaterials(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null));
        }
        [HttpPost]
        [Route("GetTestPackageById")]
        public async Task<IHttpActionResult> GetTestPackageById(int Id)
        {
            return WrapResponse(await TestManager.GetTestPackageById(Id));
        }
        [HttpPost]
        [Route("GetScore")]
        public async Task<IHttpActionResult> GetScore(int Id)
        {
            return WrapResponse(await TestManager.GetScore(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null));
        }
        [HttpPost]
        [Route("GetInfoAboutTest")]
        public async Task<IHttpActionResult> GetInfoAboutTest(int Id)
        {
            return WrapResponse(await TestManager.GetInfoAboutTest(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null));
        }
        [HttpPost]
        [Route("StartTest")]
        public async Task<IHttpActionResult> StartTest(int Id, string localization = null)
        {
            try
            {
                await TestManager.StartTest(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null);

                await LogManager.SaveLog(CurrentUser.Id, HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"], ActionType.User_StartTest);
                var Answered = await TestManager.GetActiveTestAnswers(Id);
                return WrapResponse(new { Packages = await TestManager.GetTestPackageById(Id), Date = await TestManager.ToggleTimer(Id, 2, null, localization), Answered });
            }
            catch (Exception e)
            {
                return WrapResponse(e.Message);
            }
        }

        [HttpPost]
        [Route("FinishTest")]
        public async Task<IHttpActionResult> FinishTest(int Id)
        {
            await LogManager.SaveLog(CurrentUser.Id, HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"], ActionType.User_FinishTest);
            await TestManager.FinishTest(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null);
            return WrapResponse(true);
        }

        [Route("GetUserTests")]
        public async Task<IHttpActionResult> GetUserTests(string Localization = "RU")
        {
            //ToDo Раскомментить 
            // await LogManager.SaveLog(CurrentUser.Id, Request.ServerVariables["REMOTE_ADDR"], 4);
            return WrapResponse(await TestManager.GetUserTests(CurrentUser.Id, Localization));
        }
        [HttpPost]
        [Route("GetChatMessages")]
        public async Task<IHttpActionResult> GetChatMessages(int Id, string Localization = "RU")
        {
            return WrapResponse(await TestManager.GetChatMessages(Id, Localization));
        }
        [HttpPost]
        [Route("GetQrCode")]
        public async Task<IHttpActionResult> GetQrCode(int Id)
        {
            QRCodeEncoder encoder = new QRCodeEncoder();
            Bitmap qrCode = encoder.Encode("https://de.ncfu.ru/user/qrscanner?Id=" + Id);
            string base64 = "";
            using (var ms = new MemoryStream())
            {
                qrCode.Save(ms, ImageFormat.Bmp);
                base64 = Convert.ToBase64String(ms.GetBuffer());
            }
            return WrapResponse(base64);
        }
        [HttpPost]
        [Route("SaveQrCode")]
        public async Task<IHttpActionResult> SaveQrCode(int Id, int TestingPackageId)
        {
            QRCodeEncoder encoder = new QRCodeEncoder();
            Bitmap qrCode = encoder.Encode(await Task.Factory.StartNew(() => JsonConvert.SerializeObject(new { TestingProfileId = Id, TestingPackageId })));
            string base64 = "";
            using (var ms = new MemoryStream())
            {
                qrCode.Save(ms, ImageFormat.Bmp);
                base64 = Convert.ToBase64String(ms.GetBuffer());
            }
            await TestManager.SaveQrCode(Id, TestingPackageId, base64);
            return WrapResponse(base64);
        }
        [HttpPost]
        [Route("ResetPlaceRequest")]
        public async Task<IHttpActionResult> ResetPlaceRequest()
        {
            try
            {
                await TestManager.ResetPlaceRequest(CurrentUser.Id);
                return WrapResponse(1);
            }
            catch (Exception e)
            {
                return WrapResponse(0);
            }
        }
        #endregion

        #region Managers
        protected TestManager TestManager
        {
            get
            {
                return Request.GetOwinContext().Get<TestManager>();
            }
        }
        protected AuditoryManager AuditoryManager
        {
            get
            {
                return Request.GetOwinContext().Get<AuditoryManager>();
            }
        }
        protected ProctorManager ProctorManager
        {
            get
            {
                return Request.GetOwinContext().Get<ProctorManager>();
            }
        }
        protected LogManager LogManager
        {
            get
            {
                return Request.GetOwinContext().Get<LogManager>();
            }
        }
        #endregion

        public class ForRecogn
        {
            public string Image { get; set; }
            public int Id { get; set; }
        }
    }
}