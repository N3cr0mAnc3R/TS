using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
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
        public FileResult Download(int Id, int Type)
        {
            return DownloadMultipleFiles(TestManager.GetFilesByTestingProfile(Id, Type).ToList());
        }
        public FileResult DownloadMultipleFiles(List<byte[]> byteArrayList)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
                {
                    int counter = 0;
                    foreach (var file in byteArrayList)
                    {
                        var entry = archive.CreateEntry(counter++ + ".webm", CompressionLevel.Fastest);
                        using (var zipStream = entry.Open())
                        {
                            zipStream.Write(file, 0, file.Length);
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