using Accord.Imaging;
using Accord.Imaging.Filters;
using Accord.Vision.Detection;
using Accord.Vision.Detection.Cascades;
using MessagingToolkit.QRCode.Codec;
using Microsoft.AspNet.Identity.Owin;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.Common;
using WebApp.Models.DB;
using WebApp.Models.Logs;
using WebApp.Models.Proctoring;
using WebApp.Models.UserTest;
using Image = System.Drawing.Image;

namespace WebApp.Controllers
{
    public class UserController : BaseController
    {
        public static Dictionary<int, Timer> timers;
        public static List<int> requestList;
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
            if (Session["Localization"] == null)
            {
                Session["Localization"] = Language.RU;
            }
            ViewBag.Title = Session["Localization"].ToString() == "RU" ? "Режим ожидания" : "Waiting";
            ViewBag.PlaceInfo = await AuditoryManager.GetFreePlaces((CurrentUser == null) ? (Guid?)null : CurrentUser.Id);
            return View();
        }
        [HttpPost]
        public async Task<JsonResult> GetFreePlaces()
        {
            return Json(await AuditoryManager.GetFreePlaces((CurrentUser == null) ? (Guid?)null : CurrentUser.Id));
        }
        public ActionResult AccountProfile()
        {
            if (!Request.IsAuthenticated)
            {
                Redirect("/account/login");
            }
            return View();
        }
        public ActionResult QRScanner()
        {
            if (Session["Localization"] == null)
            {
                Session["Localization"] = Language.RU;
            }
            ViewBag.Title = Session["Localization"].ToString() == "RU"? "Удалённая загрузка": "Remote uploading";
            return View();
        }
        public async Task<ActionResult> Process(int Id)
        {
            if (Request.IsAuthenticated)
            {
                bool HasAccess = await TestManager.GetSecurity(Id, CurrentUser.Id);
                if (!HasAccess)
                {
                    return Redirect("/user/waiting");
                }
            }
            //TestManager.GetSecurity(Id, )
            return View();
        }
        public async Task<JsonResult> GetSecurity(int Id, string PlaceConfig)
        {
            bool HasAccess = await TestManager.GetSecurity(Id, (Guid?)null, PlaceConfig);
            return Json(new { HasAccess });
        }
        //public async Task ReconnectToSocket()
        //{
        //    if (CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651"))
        //    {
        //        foreach (var item in timers)
        //        {
        //            requestList.Add(item.Key);
        //        }
        //    }
        //}
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
        [AllowAnonymous]
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
        [AllowAnonymous]
        public JsonResult SetLocalization(Language Type)
        {
            Session["Localization"] = Type;
            return Json(new { Type = Session["Localization"].ToString() });
        }

        #endregion

        #region Подготовка
        //public JsonResult CheckPIN(int pin)
        //{
        //    return Json(TestManager.CheckPIN(pin, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetTests(string PlaceConfig)
        //{
        //    try
        //    {
        //        List<TestingModel> tests = await TestManager.GetTestsByPlaceConfig(PlaceConfig, Session["Localization"].ToString(), CurrentUser.Id);
        //        tests.AddRange(await TestManager.GetActiveTestsByPlaceConfig(PlaceConfig, CurrentUser.Id, Session["Localization"].ToString()));
        //        return Json(tests);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { Error = e.Message });
        //    }
        //}
        //public class ForRecogn
        //{
        //    public string Image { get; set; }
        //    public int Id { get; set; }
        //}
        //public async Task<JsonResult> TryVerify(ForRecogn model)
        //{
        //    //// var file = Request.Files.Get(0);
        //    //Image img, second;
        //    //using (var ms = new MemoryStream())
        //    //{
        //    //    byte[] bytes = Convert.FromBase64String(model.Image);
        //    //    ms.Write(bytes, 0, bytes.Length);
        //    //    img = Image.FromStream(ms);
        //    //}
        //    //Bitmap image = ConvertToFormat(img, PixelFormat.Format24bppRgb);
        //    //using (var ms = new MemoryStream())
        //    //{
        //    //    byte[] bytes = ((await AuditoryManager.GetUserPicture(model.Id, null, Session["Localization"].ToString())).Picture);
        //    //    ms.Write(bytes, 0, bytes.Length);
        //    //    second = Image.FromStream(ms);
        //    //}
        //    //Bitmap image1 = ConvertToFormat(second, PixelFormat.Format24bppRgb);
        //    //HaarObjectDetector faceDetector = new HaarObjectDetector(new FaceHaarCascade(), minSize: 25, searchMode: ObjectDetectorSearchMode.NoOverlap);
        RectanglesMarker facesMarker = new RectanglesMarker(Color.Red);
        //    //RectanglesMarker facesMarker1 = new RectanglesMarker(Color.Red);
        //    //facesMarker.Rectangles = faceDetector.ProcessFrame(image);
        //    ////if(facesMarker.Rectangles.Count() == 0)
        //    ////{
        //    ////    //1 - не найдено лицо
        //    ////    return Json(new { Error = 1 });
        //    ////}

        //    //if (facesMarker.Rectangles.Count() > 0)
        //    //    image = image.Clone(facesMarker.Rectangles.First(), PixelFormat.Format24bppRgb);

        //    //facesMarker1.Rectangles = faceDetector.ProcessFrame(image1);
        //    //if (facesMarker1.Rectangles.Count() > 0)
        //    //    image1 = image1.Clone(facesMarker1.Rectangles.First(), PixelFormat.Format24bppRgb);

        //    //string result = "";
        //    //using (var ms = new MemoryStream())
        //    //{
        //    //    image.Save(ms, ImageFormat.Png);
        //    //    result = Convert.ToBase64String(ms.ToArray());
        //    //}

        //    //return Json(result);

        //    await AuditoryManager.SetUserVerified(model.Id, true, CurrentUser.Id);
        //    //System.Threading.Thread.Sleep(3000);
        //    return Json(true);
        //    //return Json(Compare(image1, image, 0.85));
        //    //return Json(Compare(ConvertToFormat(second, PixelFormat.Format24bppRgb), ConvertToFormat(img, PixelFormat.Format24bppRgb), 0.8, 0.6f));
        //}
        public static Bitmap ConvertToFormat(Image image, PixelFormat format)
        {
            Bitmap copy = new Bitmap(image.Width, image.Height, format);
            using (Graphics gr = Graphics.FromImage(copy))
            {
                gr.DrawImage(image, new Rectangle(0, 0, copy.Width, copy.Height));
            }
            return copy;
        }
        public static bool Compare(Bitmap image1, Bitmap image2, double comparisionLevel)
        {
            try
            {
                var a = new ExhaustiveTemplateMatching();
                var b = a.ProcessImage(image1, image2);
                if (b.Count() > 0)
                {
                    var c = b[0].Similarity >= comparisionLevel;
                    return c;
                }
                else return false;
            }
            catch
            {
                return Compare(image2, image1, comparisionLevel);
            }
            //return new ExhaustiveTemplateMatching(threshold)
            //   .ProcessImage(To24bppRgbFormat(image1), To24bppRgbFormat(image2))[0]
            //  .Similarity >= comparisionLevel;
        }
        #endregion
        #region Тестирование
        //public async Task<JsonResult> FinishTest(int Id)
        //{
        //    //ToDo Раскомментить 
        //    await LogManager.SaveLog(CurrentUser.Id, Request.ServerVariables["REMOTE_ADDR"], 4);
        //    await TestManager.FinishTest(Id, Session["Localization"].ToString(), CurrentUser != null ? CurrentUser.Id : (Guid?)null);
        //    return Json(true);
        //}
        //public async Task<JsonResult> StartTest(int Id, string localization = null)
        //{
        //    try
        //    {
        //        //ToDo Раскомментить 
        //        await TestManager.StartTest(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null, Session["Localization"].ToString());

        //        await LogManager.SaveLog(CurrentUser.Id, Request.UserHostAddress, 2);
        //        var Answered = await TestManager.GetActiveTestAnswers(Id, Session["Localization"].ToString());
        //        return Json(new { Packages = await TestManager.GetTestPackageById(Id, Session["Localization"].ToString()), Date = await TestManager.ToggleTimer(Id, 2, null, localization), Answered });
        //    }
        //    catch(Exception e)
        //    {
        //        return Json(e.Message);
        //    }
        //}
        //public async Task<JsonResult> GetInfoAboutTest(int Id)
        //{
        //    return Json(await TestManager.GetInfoAboutTest(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetScore(int Id)
        //{
        //    return Json(await TestManager.GetScore(Id, CurrentUser != null ? CurrentUser.Id : (Guid?)null, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetTestPackageById(int Id)
        //{
        //    return Json(await TestManager.GetTestPackageById(Id, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetSourceMaterials(int Id)
        //{
        //    return Json(await TestManager.GetSourceMaterials(Id, Session["Localization"].ToString(), CurrentUser != null ? CurrentUser.Id : (Guid?)null));
        //}
        //public async Task<string> GetSourceMaterial(int Id)
        //{
        //    return await TestManager.GetSourceMaterial(Id, Session["Localization"].ToString(), CurrentUser != null ? CurrentUser.Id : (Guid?)null);
        //}
        //[HttpPost]
        //public async Task<JsonResult> GetCurrentUser(int Id)
        //{
        //    return Json(await TestManager.GetUserInfoByTestingProfile(Id, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetTestQuestionsById(int Id)
        //{
        //    return Json(await TestManager.GetTestQuestionsById(Id, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> GetTestAnswersById(int Id)
        //{
        //    return Json(await TestManager.GetTestAnswersById(Id, Session["Localization"].ToString()));
        //}
        //public async Task<JsonResult> UpdateQuestionAnswer(IEnumerable<QuestionAnswer> answer)
        //{
        //    await TestManager.UpdateQuestionAnswer(answer);
        //    await LogManager.SaveLog(CurrentUser.Id, Request.UserHostAddress, 3);
        //    return Json(true);
        //}
        //public async Task<JsonResult> GetQuestionImage(int Id, int Part = 1)
        //{
        //    QuestionModel model = (await TestManager.GetQuestionImage(Id, Session["Localization"].ToString())).First();
        //    //if (Type != 3)
        //    // {
        //    model.QuestionImage = Cropper.Cropper.CropImageWithFix(model.QuestionImage);
        //    //}
        //    int Partition = 1200000;
        //    int left = model.QuestionImage.Length - (Part * Partition);
        //    if (left < Partition)
        //    {
        //        model.QuestionImage = model.QuestionImage.Substring((Part - 1) * Partition);
        //    }
        //    else
        //    {
        //        model.QuestionImage = "flag" + model.QuestionImage.Substring((Part - 1) * Partition, Partition);
        //    }
        //    return Json(model);
        //}
        //public async Task<JsonResult> GetAnswerImage(int Id)
        //{
        //    AnswerModel model = (await TestManager.GetAnswerImage(Id, Session["Localization"].ToString())).First();
        //    model.AnswerImage = Cropper.Cropper.CropImageWithFix(model.AnswerImage);
        //    return Json(model);
        //}
        //public async Task<string> GetUserAnswer(Guid Id)
        //{
        //    return await TestManager.GetUserAnswer(Id, CurrentUser.Id, Session["Localization"].ToString());
        //}
        //public async Task<JsonResult> GetErrorTypes()
        //{
        //    return Json(await TestManager.GetErrorTypes(Session["Localization"].ToString(), (CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        //}
        //public async Task<JsonResult> SetUserErrors(int Id, int Type)
        //{
        //    return Json(await TestManager.SetUserErrors(Id, Type, Session["Localization"].ToString(), (CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        //}
        //public async Task<JsonResult> GetUserErrors(int Id)
        //{
        //    return Json(await TestManager.GetUserErrors(Id, Session["Localization"].ToString(), (CurrentUser != null ? CurrentUser.Id : (Guid?)null)));
        //}
        //public async Task PauseTest(int Id, string Localization)
        //{
        //    await TestManager.ToggleTimer(Id, 1, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id), Localization);
        //}

        //[HttpPost]
        //public JsonResult GetProctorRooms()
        //{
        //    return Json(rooms);
        //}
        //[HttpPost]
        //public async Task<JsonResult> GetProctorRoom(int Id)
        //{

        //    ProctorRoom room = new ProctorRoom();
        //    room.Users = await ProctorManager.GetProctorUsers(Id, (CurrentUser != null ? CurrentUser.Id : (Guid?)null), Session["Localization"].ToString());
        //    foreach (var item in room.Users)
        //    {
        //        if (room.ComputerList == null) room.ComputerList = new List<ProctorEnrollee>();
        //        room.ComputerList.Add(new ProctorEnrollee() { Discipline = item.DisciplineName, FIO = item.LastName + " " + item.FirstName + " " + item.MiddleName, IsOnline = item.IsOnline, TestingProfileId = Id });
        //    }
        //    return Json(room);
        //    //return Json(rooms.Where(a => a.Id == Id).FirstOrDefault());
        //}


        #endregion
        #region Соединение
        //[HttpPost]
        //public async Task<JsonResult> HasConnection(SavePictureModel model)
        //{
        //    if (timers == null)
        //    {
        //        timers = new Dictionary<int, Timer>();
        //    }
        //    if (requestList == null)
        //    {
        //        requestList = new List<int>();
        //    }
        //    if (!model.NeedDispose)
        //    {
        //        if (timers.ContainsKey(model.TestingProfileId))
        //        {
        //            timers[model.TestingProfileId].Stop();
        //            timers[model.TestingProfileId].Start();
        //        }
        //        else
        //        {
        //            var timer = new Timer(60000);
        //            timer.Enabled = true;
        //            timer.Elapsed += Timer_Elapsed;
        //            timer.Start();
        //            timers.Add(model.TestingProfileId, timer);
        //        }
        //    }
        //    else
        //    {
        //        if (timers.ContainsKey(model.TestingProfileId))
        //        {
        //            timers[model.TestingProfileId].Stop();
        //            timers[model.TestingProfileId].Dispose();
        //            timers.Remove(model.TestingProfileId);
        //        }
        //        //await LogManager.SaveLog(CurrentUser.Id, Request.UserHostAddress, 3);
        //        //await FinishTest(model.TestingProfileId);
        //    }
        //    if (requestList.Count > 0)
        //    {
        //        if (requestList.Contains(model.TestingProfileId))
        //        {
        //            requestList.Remove(model.TestingProfileId);
        //            return Json(true);
        //        }
        //    }
        //    return Json(false);
        //    //await TestManager.SaveImage(model);
        //}

        [HttpPost]
        public async Task<JsonResult> SaveVideoFile(SavePictureModel model)
        {
            if (Request.Files.Count > 0)
            {
                if (model.Type == 1)
                {
                    model.CameraFile = Request.Files.Get(0);
                }
                else
                {
                    model.ScreenFile = Request.Files.Get(0);
                }
            }
            if (model.CameraFile != null && model.CameraFile.ContentLength > 0)
            {
                await TestManager.FileUploadAsync(model, 1, CurrentUser != null ? CurrentUser.Id : (Guid?)null);
            }
            if (model.ScreenFile != null && model.ScreenFile.ContentLength > 0)
            {
                await TestManager.FileUploadAsync(model, 2, CurrentUser != null ? CurrentUser.Id : (Guid?)null);
            }
            return Json(true);
        }
        [HttpPost]
        public async Task<JsonResult> SaveAnswerFile(SavePictureModel model)
        {
            if (Request.Files.Count > 0)
            {
                model.AnswerFile = Request.Files.Get(0);
            }
            //await LogManager.SavelLog(CurrentUser.Id, Request.UserHostAddress, 3);
            return Json(await TestManager.FileAnswerUploadAsync(model, CurrentUser != null ? CurrentUser.Id : (Guid?)null));
        }
        private async void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var timer = (Timer)sender;
            var founded = timers.Where(a => a.Value == timer).First();
            await TestManager.ToggleTimer(founded.Key, 2, ((CurrentUser == null) ? (Guid?)null : CurrentUser.Id), Session["Localization"].ToString());
        }

        //[HttpPost]
        //public async Task<JsonResult> GetChatMessages(int Id)
        //{
        //    return Json(await TestManager.GetChatMessages(Id, Session["Localization"].ToString()));
        //}


        //[HttpPost]
        //public async Task<JsonResult> GetQrCode(int Id)
        //{
        //    QRCodeEncoder encoder = new QRCodeEncoder();
        //    Bitmap qrCode = encoder.Encode("https://de.ncfu.ru/user/qrscanner?Id=" + Id);
        //    string base64 = "";
        //    using (var ms = new MemoryStream())
        //    {
        //        qrCode.Save(ms, ImageFormat.Bmp);
        //        base64 = Convert.ToBase64String(ms.GetBuffer());
        //    }
        //    return Json(base64);
        //}


        //[HttpPost]
        //public async Task<JsonResult> SaveQrCode(int Id, int TestingPackageId)
        //{
        //    QRCodeEncoder encoder = new QRCodeEncoder();
        //    Bitmap qrCode = encoder.Encode(await Task.Factory.StartNew(() => JsonConvert.SerializeObject(new { TestingProfileId = Id, TestingPackageId  })));
        //    string base64 = "";
        //    using (var ms = new MemoryStream())
        //    {
        //        qrCode.Save(ms, ImageFormat.Bmp);
        //        base64 = Convert.ToBase64String(ms.GetBuffer());
        //    }
        //    await TestManager.SaveQrCode(Id, TestingPackageId, base64);
        //    return Json(base64);
        //}

        //[HttpPost]
        //public async Task<JsonResult> ResetPlaceRequest()
        //{
        //    try
        //    {
        //        await TestManager.ResetPlaceRequest(CurrentUser.Id);
        //        return Json(1);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(0);
        //    }
        //}
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
        //protected ProctorManager ProctorManager
        //{
        //    get
        //    {
        //        return Request.GetOwinContext().Get<ProctorManager>();
        //    }
        //}

        //protected LogManager LogManager
        //{
        //    get
        //    {
        //        return Request.GetOwinContext().Get<LogManager>();
        //    }
        //}

        [HttpPost]
        public JsonResult GetFileBase(int Id)
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