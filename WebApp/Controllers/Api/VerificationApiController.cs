using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models.Common;
using WebApp.Models.Proctoring;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/verification")]
    public class VerificationApiController: BaseApiController
    {
        [HttpPost]
        [Route("SaveMark")]
        public async Task SaveMark(SaveMarkModel model)
        {
            await ProctorManager.SaveMark(CurrentUser.Id, model);
        }
        [HttpPost]
        [Route("GetDisciplines")]
        public async Task<IHttpActionResult> GetDisciplines(SaveMarkModel model)
        {
            return WrapResponse(await ProctorManager.GetDisciplines(CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetMarks")]
        public async Task<IHttpActionResult> GetMarks(int Id)
        {
            return WrapResponse(await ProctorManager.GetMarks(CurrentUser.Id, Id));
        }
        protected ProctorManager ProctorManager
        {
            get
            {
                return Request.GetOwinContext().Get<ProctorManager>();
            }
        }
    }
}