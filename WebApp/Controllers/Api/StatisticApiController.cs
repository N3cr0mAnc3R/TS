using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models;
using WebApp.Models.Common;
using WebApp.Models.Statistic;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/statistic")]
    public class StatisticApiController : BaseApiController
    {
        [HttpPost]
        [Route("findfio")]
        public async Task<IHttpActionResult> findfio(TotalModel model)
        {
            return WrapResponse(await StatisticManager.FindFioByFamilyName(model.Fio, CurrentUser.Id));
        }
        [HttpPost]
        [Route("getById")]
        public async Task<IHttpActionResult> GetById(int Id)
        {
            return WrapResponse(await StatisticManager.GetUserById(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("resetProfile")]
        public async Task<IHttpActionResult> ResetProfileBy(int Id)
        {
            return WrapResponse(await StatisticManager.ResetProfile(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("resetProfileTotal")]
        public async Task<IHttpActionResult> resetProfileTotal(int Id)
        {
            return WrapResponse(await StatisticManager.resetProfileTotal(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("finishProfile")]
        public async Task<IHttpActionResult> FinishProfile(int Id)
        {
            return WrapResponse(await StatisticManager.FinishProfile(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("finishProfileTotal")]
        public async Task<IHttpActionResult> FinishProfileTotal(int Id)
        {
            return WrapResponse(await StatisticManager.FinishProfileTotal(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("nullifyProfile")]
        public async Task<IHttpActionResult> NullifyProfile(int Id)
        {
            return WrapResponse(await StatisticManager.NullifyProfile(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("nullifyProfileTotal")]
        public async Task<IHttpActionResult> NullifyProfileTotal(int Id)
        {
            return WrapResponse(await StatisticManager.NullifyProfileTotal(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("deleteProfile")]
        public async Task<IHttpActionResult> DeleteProfile(int Id)
        {
            try
            {
                await StatisticManager.DeleteProfile(Id, CurrentUser.Id);
                return WrapResponse(1);
            }
            catch
            {
                return WrapResponse(0);
            }
        }
        [HttpPost]
        [Route("getCurrentPlace")]
        public async Task<IHttpActionResult> GetCurrentPlace(int Id)
        {
            return WrapResponse(await StatisticManager.GetCurrentPlace(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("GetTestingProfiles")]
        public async Task<IHttpActionResult> GetTestingProfiles(FullTestingProfileModel model)
        {
            return WrapResponse(await StatisticManager.GetTestingProfiles(CurrentUser.Id, model));
        }
        [HttpPost]
        [Route("getAuditoriums")]
        public async Task<IHttpActionResult> GetAuditoriums()
        {
            return WrapResponse(await StatisticManager.GetAuditoriums(CurrentUser.Id));
        }
        [HttpPost]
        [Route("getAuditoryInfo")]
        public async Task<IHttpActionResult> GetAuditoryInfo(int Id)
        {
            return WrapResponse(await StatisticManager.GetAuditoryInfo(Id, CurrentUser.Id));
        }
        [HttpPost]
        [Route("setPlaceToUser")]
        public async Task SetPlaceToUser(TotalModel model)
        {
            await StatisticManager.SetPlaceToUser(model.TestingProfileId, model.PlaceId, CurrentUser.Id);
        }
        protected StatisticManager StatisticManager
        {
            get
            {
                return Request.GetOwinContext().Get<StatisticManager>();
            }
        }
    }
}