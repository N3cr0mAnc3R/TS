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
using WebApp.Models.UserTest;

namespace WebApp.Controllers
{
    public class UserController : BaseController
    {
        public static SavePictureModel connection;
        public static Dictionary<int, Timer> timers;
        // GET: User
        public ActionResult Waiting()
        {
            return View();
        }

        public ActionResult TestList()
        {
            return View();
        }

        public JsonResult GetTests(string PlaceConfig)
        {
            List<TestingModel> tests = TestManager.GetTestsByPlaceConfig(PlaceConfig);
            tests.AddRange(TestManager.GetActiveTestsByPlaceConfig(PlaceConfig));
            return Json(tests);
        }
        public JsonResult GetAnswersForActiveTest(int Id)
        {
            return Json(new { Packages = TestManager.GetTestPackageById(Id), Date = DateTime.Now, Answered = TestManager.GetActiveTestAnswers(Id) });
        }
        public JsonResult CheckPIN(int pin)
        {
            return Json(TestManager.CheckPIN(pin));
        }
        protected TestManager TestManager
        {
            get
            {
                return Request.GetOwinContext().Get<TestManager>();
            }
        }
        public async Task FinishTest(int Id)
        {
            //ToDo Раскомментить 
            await TestManager.FinishTest(Id, CurrentUser.Id);
        }
        public async Task<JsonResult> StartTest(int Id)
        {
            //ToDo Раскомментить 
            //await TestManager.StartTest(Id, CurrentUser.Id);
            return Json(new { Packages = TestManager.GetTestPackageById(Id), Date = DateTime.Now });
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
        [HttpPost]
        public async Task<JsonResult> HasConnection(SavePictureModel model)
        {
            if(timers == null)
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
            model.File = Request.Files.Get(0);
            await TestManager.FileUploadAsync(model, CurrentUser == null? CurrentUser.Id: (Guid?)null);
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
        private void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var timer = (Timer)sender;
            var founded = timers.Where(a => a.Value == timer).First();
            //TestManager.StopTimer(founded.Key, 2, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
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
    }
}