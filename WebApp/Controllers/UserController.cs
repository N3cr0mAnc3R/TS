using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Common;
using WebApp.Models.DB;
using WebApp.Models.Proctoring;
using WebApp.Models.UserTest;

namespace WebApp.Controllers
{
    public class UserController : BaseController
    {
        public static SavePictureModel connection;
        public static Dictionary<int, Timer> timers;
        public enum Language
        {
            RU = 1,
            EN = 2
        }
        public static List<ProctorRoom> rooms;


        // GET: User
        #region Представления
        public async Task<ActionResult> Waiting()
        {
            ViewBag.PlaceInfo = await AuditoryManager.GetFreePlaces((CurrentUser == null) ? (Guid?)null : CurrentUser.Id);
            return View();
        }

        public ActionResult TestList()
        {
            return View();
        }
        public async Task<ActionResult> Process(int Id)
        {
            if (Request.IsAuthenticated)
            {
                bool HasAccess = await TestManager.GetSecurity(Id, CurrentUser.Id);
                if (!HasAccess)
                {
                    return Redirect("user/waiting");
                }
            }
            //TestManager.GetSecurity(Id, )
            return View();
        }
        public async Task<JsonResult> GetSecurity(int Id, string PlaceConfig)
        {
            bool HasAccess = await TestManager.GetSecurity(Id, (Guid?)null, PlaceConfig);
            return Json(new { HasAccess});
        }
        public async Task<ActionResult> ProctorProcessList()
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
        public async Task<ActionResult> ProctorProcess(int Id)
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
        public JsonResult GetLocalization()
        {
            //1 - ru, 2 - en
            if (Session["Localization"] == null)
            {
                Session["Localization"] = Language.RU;
            }
            return Json(new { Localization = (int)Session["Localization"] });
        }
        [HttpPost]
        public JsonResult SetLocalization(Language Type)
        {
            Session["Localization"] = Type;
            return Json(new { Type = Session["Localization"].ToString() });
        }

        #endregion

        #region Подготовка
        public JsonResult CheckPIN(int pin)
        {
            return Json(TestManager.CheckPIN(pin, Session["Localization"].ToString()));
        }
        public JsonResult GetTests(string PlaceConfig)
        {
            try
            {
                List<TestingModel> tests = TestManager.GetTestsByPlaceConfig(PlaceConfig, Session["Localization"].ToString());
                tests.AddRange(TestManager.GetActiveTestsByPlaceConfig(PlaceConfig, Session["Localization"].ToString()));
                return Json(tests);
            }
            catch (Exception e)
            {
                return Json(new { Error = e.Message });
            }
        }
        #endregion
        #region Тестирование
        public async Task FinishTest(int Id)
        {
            //ToDo Раскомментить 
            await TestManager.FinishTest(Id, Session["Localization"].ToString(), CurrentUser == null ? CurrentUser.Id : (Guid?)null);
        }
        public async Task<JsonResult> StartTest(int Id, string localization = null)
        {
            //ToDo Раскомментить 
            //await TestManager.StartTest(Id, CurrentUser.Id);
            var Answered = TestManager.GetActiveTestAnswers(Id, Session["Localization"].ToString());
            return Json(new { Packages = TestManager.GetTestPackageById(Id, Session["Localization"].ToString()), Date = TestManager.ToggleTimer(Id, 2, null, localization), Answered = Answered });
        }
        public JsonResult GetTestPackageById(int Id)
        {
            return Json(TestManager.GetTestPackageById(Id, Session["Localization"].ToString()));
        }
        public async Task<JsonResult> GetSourceMaterials(int Id)
        {
            return Json(await TestManager.GetSourceMaterials(Id, Session["Localization"].ToString(), CurrentUser == null ? CurrentUser.Id : (Guid?)null));
        }
        public JsonResult GetTestQuestionsById(int Id)
        {
            return Json(TestManager.GetTestQuestionsById(Id, Session["Localization"].ToString()));
        }
        public JsonResult GetTestAnswersById(int Id)
        {
            return Json(TestManager.GetTestAnswersById(Id, Session["Localization"].ToString()));
        }
        public void UpdateQuestionAnswer(IEnumerable<QuestionAnswer> answer)
        {
            TestManager.UpdateQuestionAnswer(answer);
        }
        public JsonResult GetQuestionImage(int Id)
        {
            QuestionModel model = TestManager.GetQuestionImage(Id, Session["Localization"].ToString()).First();
            model.QuestionImage = Cropper.Cropper.CropImageWithFix(model.QuestionImage);
            return Json(model);
        }
        public JsonResult GetAnswerImage(int Id)
        {
            AnswerModel model = TestManager.GetAnswerImage(Id, Session["Localization"].ToString()).First();
            model.AnswerImage = Cropper.Cropper.CropImageWithFix(model.AnswerImage);
            return Json(model);
        }
        public async Task<JsonResult> GetErrorTypes()
        {
            return Json(await TestManager.GetErrorTypes(Session["Localization"].ToString(), (CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
        }
        public async Task<JsonResult> SetUserErrors(int Id, int Type)
        {
            return Json(await TestManager.SetUserErrors(Id, Type, Session["Localization"].ToString(), (CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
        }
        public async Task<JsonResult> GetUserErrors(int Id)
        {
            return Json(await TestManager.GetUserErrors(Id, Session["Localization"].ToString(), (CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
        }
        public void PauseTest(int Id, string Localization)
        {
            TestManager.ToggleTimer(Id, 1, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id), Localization);
        }

        [HttpPost]
        public JsonResult GetProctorRooms()
        {
            return Json(rooms);
        }
        [HttpPost]
        public async Task<JsonResult> GetProctorRoom(int Id)
        {

            ProctorRoom room = new ProctorRoom();
            room.Users = await ProctorManager.GetProctorUsers(Id, (CurrentUser == null ? CurrentUser.Id : (Guid?)null), Session["Localization"].ToString());
            foreach (var item in room.Users)
            {
                if (room.ComputerList == null) room.ComputerList = new List<TestUser>();
                room.ComputerList.Add(new TestUser() { Discipline = item.DisciplineName, FIO = item.LastName + " " + item.FirstName + " " + item.MiddleName, IsOnline = item.IsOnline, TestingProfileId = Id });
            }
            return Json(room);
            //return Json(rooms.Where(a => a.Id == Id).FirstOrDefault());
        }


        #endregion
        #region Соединение
        [HttpPost]
        public async Task<JsonResult> HasConnection(SavePictureModel model)
        {
            if (timers == null)
            {
                timers = new Dictionary<int, Timer>();
            }
            if (!model.NeedDispose)
            {
                if (timers.ContainsKey(model.TestingProfileId))
                {
                    timers[model.TestingProfileId].Stop();
                    timers[model.TestingProfileId].Start();
                }
                else
                {
                    var timer = new Timer(30000);
                    timer.Enabled = true;
                    timer.Elapsed += Timer_Elapsed;
                    timer.Start();
                    timers.Add(model.TestingProfileId, timer);
                }
            }
            else
            {
                if (timers.ContainsKey(model.TestingProfileId))
                {
                    timers[model.TestingProfileId].Stop();
                    timers[model.TestingProfileId].Dispose();
                    timers.Remove(model.TestingProfileId);
                }
                //await FinishTest(model.TestingProfileId);
            }
            return Json(1);
            //await TestManager.SaveImage(model);
        }

        [HttpPost]
        public async Task SaveVideoFile(SavePictureModel model)
        {
            if (Request.Files.Count > 0)
            {
                model.CameraFile = Request.Files.Get(0);
                if (Request.Files.Count > 1)
                {
                    model.ScreenFile = Request.Files.Get(1);
                }
            }
            await TestManager.FileUploadAsync(model, 1, CurrentUser == null ? CurrentUser.Id : (Guid?)null);
            await TestManager.FileUploadAsync(model, 2, CurrentUser == null ? CurrentUser.Id : (Guid?)null);
        }
        private void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var timer = (Timer)sender;
            var founded = timers.Where(a => a.Value == timer).First();
            //TestManager.ToggleTimer(founded.Key, 2, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
        }

        [HttpPost]
        public async Task SaveOffer(Offer model)
        {
            if (connection == null) { connection = new SavePictureModel(); };
            connection.Offer = model;
            //await TestManager.FileUploadAsync(model, CurrentUser == null? CurrentUser.Id: (Guid?)null);
        }
        [HttpPost]
        public async Task SaveIcecandidate(SavePictureModel model)
        {
            connection.Icecandidate = model.Icecandidate;
            //await TestManager.FileUploadAsync(model, CurrentUser == null? CurrentUser.Id: (Guid?)null);
        }
        [HttpPost]
        public async Task<JsonResult> GetOffer(string Id)
        {
            // Response.ContentType = "application/octet-stream";
            //var file = TestManager.GetImage(Id);
            return Json(new { sdp = connection.Offer.Sdp, type = connection.Offer.Type });
        }
        [HttpPost]
        public async Task SaveAnswer(SavePictureModel model)
        {
            connection.Answer = model.Answer;
            //await TestManager.FileUploadAsync(model, CurrentUser == null? CurrentUser.Id: (Guid?)null);
        }
        [HttpPost]
        public async Task<JsonResult> GetAnswer(string Id)
        {
            // Response.ContentType = "application/octet-stream";
            //var file = TestManager.GetImage(Id);
            return Json(connection);
        }
        [HttpPost]
        public async Task<JsonResult> GetIcecandidate(string Id)
        {
            // Response.ContentType = "application/octet-stream";
            //var file = TestManager.GetImage(Id);
            return Json(connection);
        }
        [HttpPost]
        public async Task<JsonResult> GetChatMessages(int Id)
        {
            return Json(TestManager.GetChatMessages(Id, Session["Localization"].ToString()));
        }
        #endregion
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

        [HttpPost]
        public async Task<JsonResult> GetFileBase(int Id)
        {
            return Json(TestManager.GetFileBase(Id));
        }
        //[HttpPost]
        //public ActionResult DownloadVideoFile(int Id = 67)
        //{
        //    FileStreamDownload dwnl = TestManager.FileDownload(Id, ((CurrentUser == null)? (Guid?)null: CurrentUser.Id));
        //    return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
        //}
        //[HttpGet]
        //public ActionResult DownloadVideoFile(int Id)
        //{
        //    FileStreamDownload dwnl = TestManager.FileDownload(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
        //    return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
        //}
    }
}