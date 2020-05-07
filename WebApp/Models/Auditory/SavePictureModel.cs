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
        public HttpPostedFileBase ScreenFile { get; set; }
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
        public int TestingProfileId { get; set; }
        public bool ForCreate { get; set; }


        public string address { get; set; }
        public string candidate { get; set; }
        public string component{ get; set; }
        public string foundation { get; set; }
        public int port { get; set; }
        public int priority { get; set; }
        public string protocol { get; set; }
        public string usernameFragment { get; set; }
        public bool IsSource { get; set; }
    }
}