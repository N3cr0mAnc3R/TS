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
        public HttpPostedFileBase File { get; set; }
        public Offer Offer { get; set; }
        public string Icecandidate { get; set; }
        public string Answer { get; set; }
        public int TestingProfileId { get; set; }
        public string baseFile { get; set; }
        public bool NeedDispose { get; set; }
    }
    public class Offer
    {
        public string Type { get; set; }
        public string Sdp { get; set; }
    }
}