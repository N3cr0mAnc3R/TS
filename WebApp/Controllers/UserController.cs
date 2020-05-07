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

        public static List<ProctorRoom> rooms;

        // GET: User
        #region Представления
        public ActionResult Waiting()
        {
            return View();
        }

        public ActionResult TestList()
        {
            return View();
        }
        public ActionResult Process(int Id)
        {
            //ProctorRoom room = new ProctorRoom();
            //room.Users = ProctorManager.GetProctorUsers((CurrentUser == null ? CurrentUser.Id : (Guid?)null), null, Id);
            //foreach (var item in room.Users)
            //{
            //    if (room.ComputerList == null) room.ComputerList = new List<TestUser>();
            //    room.ComputerList.Add(new TestUser() { Discipline = item.DisciplineName, FIO = item.LastName + " " + item.FirstName + " " + item.MiddleName, IsOnline = item.IsOnline, TestingProfileId = Id });
            //}
            return View();
        }
        public ActionResult ProctorProcessList()
        {
            if(rooms == null)
            {
                //rooms = new List<ProctorRoom>()
                //{
                //    new ProctorRoom(){ Id = 1, Name = "Комната 1", ComputerList = new List<TestUser>(){
                //        new TestUser() { Id = 1, FIO = "Иванов Иван", Discipline = "Русский язык", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 67, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Петров Иван", Discipline = "Математика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 68, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Сидоров Иван", Discipline = "Математика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 69, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Иванян Иван", Discipline = "Русский язык", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 70, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Петрян Иван", Discipline = "Информатика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 71, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Сидорян Иван", Discipline = "Русский язык", IsOnline= false, IsReady = false, Specialty = "Дизайн", TestingProfileId = 72, TimeLeft = 1800 }  } },
                //    new ProctorRoom(){ Id = 2, Name = "Комната 2", ComputerList = new List<TestUser>(){
                //        new TestUser() { Id = 1, FIO = "Иванов Иван2", Discipline = "Русский язык", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 67, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Петров Иван2", Discipline = "Математика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 68, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Сидоров Иван2", Discipline = "Математика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 69, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Иванян Иван2", Discipline = "Русский язык", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 70, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Петрян Иван2", Discipline = "Информатика", IsOnline= true, IsReady = false, Specialty = "Дизайн", TestingProfileId = 71, TimeLeft = 1800 },
                //        new TestUser() { Id = 1, FIO = "Сидорян Иван2", Discipline = "Русский язык", IsOnline= false, IsReady = false, Specialty = "Дизайн", TestingProfileId = 72, TimeLeft = 1800 }  } }
                //};
                rooms = new List<ProctorRoom>() { new ProctorRoom() { Id = 67, Name = "Комната 1" } };
            }
            return View();
        }
        public ActionResult ProctorProcess(int Id)
        {
            return View();
        }

        #endregion

        #region Подготовка
        public JsonResult CheckPIN(int pin)
        {
            return Json(TestManager.CheckPIN(pin));
        }
        public JsonResult GetTests(string PlaceConfig)
        {
            List<TestingModel> tests = TestManager.GetTestsByPlaceConfig(PlaceConfig);
            tests.AddRange(TestManager.GetActiveTestsByPlaceConfig(PlaceConfig));
            return Json(tests);
        }
        #endregion
        #region Тестирование
        public async Task FinishTest(int Id)
        {
            //ToDo Раскомментить 
            await TestManager.FinishTest(Id, CurrentUser == null ? CurrentUser.Id : (Guid?)null);
        }
        public async Task<JsonResult> StartTest(int Id, string localization = null)
        {
            //ToDo Раскомментить 
            //await TestManager.StartTest(Id, CurrentUser.Id);
            var Answered = TestManager.GetActiveTestAnswers(Id);
            return Json(new { Packages = TestManager.GetTestPackageById(Id), Date = TestManager.ToggleTimer(Id, 2, null, localization), Answered = Answered });
        }
        public JsonResult GetTestPackageById(int Id)
        {
            return Json(TestManager.GetTestPackageById(Id));
        }
        public JsonResult GetTestQuestionsById(int Id)
        {
            return Json(TestManager.GetTestQuestionsById(Id));
        }
        public JsonResult GetTestAnswersById(int Id)
        {
            return Json(TestManager.GetTestAnswersById(Id));
        }
        public void UpdateQuestionAnswer(IEnumerable<QuestionAnswer> answer)
        {
            TestManager.UpdateQuestionAnswer(answer);
        }
        public JsonResult GetQuestionImage(int Id)
        {
            QuestionModel model = TestManager.GetQuestionImage(Id).First();
            model.QuestionImage = Cropper.Cropper.CropImageWithFix(model.QuestionImage);
            return Json(model);
        }
        public JsonResult GetAnswerImage(int Id)
        {
            AnswerModel model = TestManager.GetAnswerImage(Id).First();
            model.AnswerImage = Cropper.Cropper.CropImageWithFix(model.AnswerImage);
            return Json(model);
        }
        public async Task<JsonResult> GetErrorTypes(string Localization = null)
        {
            return Json(await TestManager.GetErrorTypes(Localization, (CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
        }
        public async Task<JsonResult> SetUserErrors(int Id, int Type)
        {
            return Json(await TestManager.SetUserErrors(Id, Type, (CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
        }
        public async Task<JsonResult> GetUserErrors(int Id)
        {
            return Json(await TestManager.GetUserErrors(Id,(CurrentUser == null ? CurrentUser.Id : (Guid?)null)));
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
        public JsonResult GetProctorRoom(int Id)
        {

            ProctorRoom room = new ProctorRoom();
            room.Users = ProctorManager.GetProctorUsers(Id, (CurrentUser == null ? CurrentUser.Id : (Guid?)null), null);
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
            await TestManager.FileUploadAsync(model, CurrentUser == null ? CurrentUser.Id : (Guid?)null);
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
            return Json(TestManager.GetChatMessages(Id));
        }
        #endregion
        protected TestManager TestManager
        {
            get
            {
                return Request.GetOwinContext().Get<TestManager>();
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
        [HttpGet]
        public ActionResult DownloadVideoFile(int Id)
        {
            FileStreamDownload dwnl = TestManager.FileDownload(Id, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
            return new System.Web.Mvc.FileStreamResult(dwnl.Stream, dwnl.ContentType) { FileDownloadName = dwnl.Name };
        }
    }
}