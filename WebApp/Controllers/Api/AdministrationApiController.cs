﻿using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models.Administration;
using WebApp.Models.Common;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/Administration")]
    public class AdministrationApiController : BaseApiController
    {

        [HttpPost]
        [Route("GetPeopleWithAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetPeopleWithAccess(int Id)
        {
            return WrapResponse(await AdministrationManager.GetPeopleWithAccess(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetPeopleWithReportAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetPeopleWithReportAccess(int Id)
        {
            return WrapResponse(await AdministrationManager.GetPeopleWithReportAccess(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("HasAccessToReport")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasAccessToReport(int Id)
        {
            return WrapResponse(await AdministrationManager.HasAccessToReport(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("HasFullAccess")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasFullAccess()
        {
            return WrapResponse(await AdministrationManager.HasFullAccess(CurrentUser.Id));
        }
        [HttpPost]
        [Route("getAuditoryById")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GetAuditoryById(int Id)
        {
            return WrapResponse(await AdministrationManager.GetAuditoryPlacesById(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("GetAuditoryList")]
        public async Task<IHttpActionResult> GetAuditoryList()
        {
            return WrapResponse(await AdministrationManager.GetAuditoryList(CurrentUser.Id));
        }
        [HttpPost]
        [Route("HasAccess")]
        public async Task<IHttpActionResult> HasAccess(int url)
        {
            bool result = false;

            List<int> roles = (await AccountManager.GetAllUserRoles(CurrentUser.Id)).ToList();

            //1 - аудитории, 2 - Проверка, 3 - отчёты для админа, 4 - отчёты для комиссии
            switch (url)
            {
                case 1: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 4, 6, 7 })) result = true; break;
                case 2: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 7 })) result = true; break;
                case 3: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6, 7 })) result = true; break;
                case 5: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6, 7, 9 })) result = true; break;
                case 4: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 6, 7 })) result = true; break;
                default: break;
            }
            return WrapResponse(result);

        }
        [HttpPost]
        [Route("HasAccessToTestingProfile")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> HasAccessToAuditory(int Id)
        {
            return WrapResponse(await AdministrationManager.HasAccessToTestingProfile(CurrentUser.Id, Id));
        }
        [HttpPost]
        [Route("SetUserToReport")]
        [AllowAnonymous]
        public async Task<int> SetUserToReport(AccessModel model)
        {
            try
            {
                await AdministrationManager.SetUserToReport(CurrentUser.Id, model);
                return 1;
            }
            catch
            {
                return 0;
            }
        }
        
        [HttpPost]
        [Route("SetUserToAuditory")]
        [AllowAnonymous]
        public async Task<int> SetUserToAuditory(AccessModel model)
        {
            try
            {
                await AdministrationManager.SetUserToAuditory(CurrentUser.Id, model);
                return 1;
            }
            catch
            {
                return 0;
            }
        }



        protected AdministrationManager AdministrationManager
        {
            get
            {
                return Request.GetOwinContext().Get<AdministrationManager>();
            }
        }
    }
}