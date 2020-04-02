using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;
using WebApp.Models.UserTest;

namespace WebApp.Controllers
{
    public class UserController : BaseController
    {
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
            return Json(TestManager.GetTestsByPlaceConfig(PlaceConfig));
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
        public async Task<JsonResult> StartTest(int Id)
        {
            //ToDo Раскомментить await TestManager.StartTest(Id, CurrentUser.Id);
            return Json(new { Packages = TestManager.GetTestPackageById(Id), Date = DateTime.Now });
        }
        public JsonResult GetTestPackageById(int Id)
        {
            return Json(TestManager.GetTestPackageById(Id));
        }
        public JsonResult GetTestQwestionsById(int Id)
        {
            return Json(TestManager.GetTestQwestionsById(Id));
        }
        public JsonResult GetTestAnswersById(int Id)
        {
            return Json(TestManager.GetTestAnswersById(Id));
        }
        public void UpdateQwestionAnswer(IEnumerable<QwestionAnswer> answer)
        {
            TestManager.UpdateQwestionAnswer(answer);
        }
        public JsonResult GetQwestionImage(int Id)
        {
            QwestionModel model = TestManager.GetQwestionImage(Id).First();
            model.QwestionImage = Cropper.Cropper.CropImage(model.QwestionImage);
            return Json(model);
        }
        public JsonResult GetAnswerImage(int Id)
        {
            AnswerModel model = TestManager.GetAnswerImage(Id).First();
            model.AnswerImage = Cropper.Cropper.CropImage(model.AnswerImage);
            return Json(model);
        }
    }
}