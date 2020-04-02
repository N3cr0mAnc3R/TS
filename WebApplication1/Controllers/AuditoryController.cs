using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Mvc;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    public class AuditoryController : BaseController
    {
        // GET: Auditory
        public ActionResult List()
        {
            return View(AuditoryManager.GetAuditoryList(CurrentUser.Id));
        }
        public ActionResult Index(int Id)
        {
            return View(AuditoryManager.GetAuditoryById(CurrentUser.Id, Id));
        }
        public JsonResult SaveNewPlace(int placeId)
        {
            try
            {
                using (MD5 md5Hash = MD5.Create())
                {
                    byte[] data = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(placeId.ToString() + DateTime.Now.ToString()));
                    StringBuilder sBuilder = new StringBuilder();
                    for (int i = 0; i < data.Length; i++)
                    {
                        sBuilder.Append(data[i].ToString("x2"));
                    }
                    AuditoryManager.UpdatePlaceConfig(placeId, CurrentUser.Id, sBuilder.ToString());
                    return Json(sBuilder.ToString());

                }
            }
            catch
            {
                return Json("Ошибка");
            }

        }
        protected AuditoryManager AuditoryManager
        {
            get
            {
                return Request.GetOwinContext().Get<AuditoryManager>();

            }
        }
    }
}