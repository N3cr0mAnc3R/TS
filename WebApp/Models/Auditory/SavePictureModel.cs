using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class SavePictureModel
    {
        public string Id { get; set; }
        public string  Image { get; set; }
        public HttpPostedFileBase CameraFile { get; set; }
        public HttpPostedFileBase AnswerFile { get; set; }
        public string AnswerFileExtension { get; set; }
        public HttpPostedFileBase ScreenFile { get; set; }
        public int Type { get; set; }
        public Offer Offer { get; set; }
        public string Icecandidate { get; set; }
        public string Answer { get; set; }
        public int TestingProfileId { get; set; }
        public string baseFile { get; set; }
        public bool NeedDispose { get; set; }
    }
    public class Offer
    {
        public int TestingProfileId { get; set; }
        public bool ForCreate { get; set; }
        public bool ForReset { get; set; }
        public bool IsMaster { get; set; }
        public int AuditoryId { get; set; }
        public int[] TestingProfileIds { get; set; }
        public bool IsAdmin { get; set; }
    }
}