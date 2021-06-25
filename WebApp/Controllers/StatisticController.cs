using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebApp.Models;

namespace WebApp.Controllers
{
    public class StatisticController : Controller
    {
        // GET: Statistic
        public ActionResult Index()
        {
            ViewBag.Title = "Отчёты и статистика";
            return View();
        }
        public ActionResult MiniTotal()
        {
            ViewBag.Title = "Страница полного модерирования";
            return View();
        }
        public ActionResult Total()
        {
            ViewBag.Title = "Страница полного модерирования";
            return View();
        }
        public async Task<FileResult> Download(int Id, int Type)
        {
            return await DownloadMultipleFiles((await TestManager.GetFilesByTestingProfile(Id, Type)).ToList());
        }
        public async Task<FileResult> DownloadMultipleFiles(List<WebApp.Models.Common.FileStreamResult> byteArrayList)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
                {
                    foreach (var file in byteArrayList)
                    {
                        var entry = archive.CreateEntry(file.Name + ".webm", CompressionLevel.Fastest);
                        using (var zipStream = entry.Open())
                        {
                           await  zipStream.WriteAsync(file.FileStreamContext, 0, file.FileStreamContext.Length);
                        }
                    }
                }

                return File(ms.ToArray(), "application/zip", "Archive.zip");
            }
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