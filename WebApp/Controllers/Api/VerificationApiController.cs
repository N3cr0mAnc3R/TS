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
        protected ProctorManager ProctorManager
        {
            get
            {
                return Request.GetOwinContext().Get<ProctorManager>();
            }
        }
    }
}