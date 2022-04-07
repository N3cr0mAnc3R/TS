using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models.Account;
using WebApp.Models.Administration;

namespace WebApp.Controllers
{
    public class AdministrationController : BaseController
    {
        // GET: Administration
        public async Task<ActionResult> Index()
        {
            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }

        [HttpPost]
        public async Task<JsonResult> SaveQuestionFile(QuestionUploadModel model)
        {
            if(Request.Files.Count > 0)
            {
               
                using (BinaryReader br = new BinaryReader(Request.Files[0].InputStream))
                {
                    byte[] array = br.ReadBytes((int)Request.Files[0].InputStream.Length);
                   // await str.ReadAsync(array, 0, array.Length);
                    model.Question = array;
                    return Json(await AdministrationManager.SaveQuestionFile(model));
                }
            }
            return Json(true);
        }
        public async Task<ActionResult> Question()
        {
            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
            }
        }
        public async Task<ActionResult> QuestionCreating(int Id)
        {
            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();
            if (AccountManager.HasOneOfRoles(roles, new int[] { 6, 7 }))
            {
                return View();
            }
            else
            {
                return Redirect("/user/waiting");
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