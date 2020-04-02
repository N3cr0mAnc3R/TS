using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    public class HomeController: Controller
    {
        public ActionResult Index()
        {
            bool validIp = true;
            if (!validIp)
            {
                return RedirectToAction("login", "account");
            }
            else
            {
                return View("User");
            }
        }

        [HttpPost]
        public async Task<JsonResult> GetSmth(TestModel m)
        {
            //Parsing parsing = new Parsing();
            //string parsedText = await parsing.ParseAsync(@"D:\test4.doc");
            // string appdatafolder = Server.MapPath("~/App_Data");
            List<string> strs = TestManager.GetImages(m.Id).ToList();
            //for(int i = 0; i < strs.Count(); i++)
            //{
            //    strs[i] = Cropper.Cropper.CropImage(strs[i]);
            //}
            return Json(strs);
        }

        [HttpPost]
        public async Task<List<FileResult>> GetSmth1(TestModel m)
        {
            //Parsing parsing = new Parsing();
            //string parsedText = await parsing.ParseAsync(@"D:\test4.doc");
            // string appdatafolder = Server.MapPath("~/App_Data");

           // FileContentResult result = File(, "pdf");

            //result.FileDownloadName = "Program " + kodCh.ToString() + ".pdf";
            List<FileResult> files = new List<FileResult>();
            var tests = TestManager.GetImages1(m.Id);
            foreach (var test in tests)
            {
                files.Add(File(test.qwestion, "pdf"));
            }
            return files;
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