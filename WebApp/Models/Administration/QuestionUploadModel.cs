using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Administration
{
    public class QuestionUploadModel
    {
        public HttpPostedFileBase QuestionFile { get; set; }
        public byte[] Question { get; set; }
        public string QuestionContentType { get; set; }
        public string QuestionExtension { get; set; }
        public string QuestionString { get; set; }
        public int? Id { get; set; }
        public int? QuestionId { get; set; }
        public int StructureDisciplineId { get; set; }
        public int ThemeId { get; set; }
        public int CategoryQuestionId { get; set; }
        public int TypeAnswerId { get; set; }
        public int IsActivity { get; set; }
    }
}