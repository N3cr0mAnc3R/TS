using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models.Account;
using WebApp.Models.Common;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/account")]
    public class AccountApiController : BaseApiController
    {
        [HttpPost]
        [AllowAnonymous]
        [Route("HasAccess")]
        public async Task<IHttpActionResult> HasAccess(int url)
        {
            bool result = false;

            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();

            //1 - аудитории, 2 - Проверка, 3 - отчёты для админа, 4 - отчёты для комиссии
            switch (url)
            {
                case 1: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 4, 6, 7 })) result = true; break;
                case 2: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 7 })) result = true; break;
                case 3: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 6, 7, 9 })) result = true; break;
                case 4: if (AccountManager.HasOneOfRoles(roles, new List<int>() { 1, 2, 3, 4, 6, 7 })) result = true; break;
                default: break;
            }
            return WrapResponse(result);

        }
        [HttpPost]
        [Route("GetCurrentUser")]
        public async Task<IHttpActionResult> GetCurrentUser()
        {
            if (CurrentUser != null)
            {
                List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
                return Json(new { PictureImage = CurrentUser.PictureImage, Id = AccountManager.HasOneOfRoles(roles, new int[] { 1, 2, 3, 4, 6, 7 }) ? CurrentUser.Id : (Guid?)null });
            }
            return WrapResponse(new { });
        }
        [HttpPost]
        [Route("IsPaul")]
        public async Task<IHttpActionResult> IsPaul()
        {
            List<int> roles = (await AccountManager.GetUserRoles((CurrentUser == null) ? (Guid?)null : CurrentUser.Id)).ToList();
            return WrapResponse(AccountManager.HasOneOfRoles(roles, new List<int>() { 7 }));
            //return WrapResponse(CurrentUser.Id == new Guid("9d193281-bf65-4002-ab0a-41a25b2b4651") || CurrentUser.Id == new Guid("0c8345b1-9a81-4424-a788-dd2f2ab069d7"));
        }
        private readonly string Secret = ConfigurationManager.AppSettings["turn:secret"];

        [HttpPost]
        [Route("GetLoginAndPassword")]
        public IHttpActionResult GetLoginAndPassword()
        {
            MD5 md5 = MD5.Create();
            string Login = GeneratePassword(6); //System.Web.Security.Membership.GeneratePassword(6, 0);
            HMAC mc = HMAC.Create("HMACSHA1");
            return WrapResponse(new { Login, Password = Convert.ToBase64String(mc.ComputeHash(Encoding.UTF8.GetBytes(Login + ":" + Secret))) });
        }
        public string GeneratePassword(int passwordSize)
        {
            string LOWER_CASE = "abcdefghijklmnopqursuvwxyz";
            string UPPER_CAES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            string NUMBERS = "123456789";
            char[] _password = new char[passwordSize];
            string charSet = ""; // Initialise to blank
            System.Random _random = new Random();
            int counter;

            // Build up the character set to choose from
            charSet += LOWER_CASE;

            charSet += UPPER_CAES;

            charSet += NUMBERS;


            for (counter = 0; counter < passwordSize; counter++)
            {
                _password[counter] = charSet[_random.Next(charSet.Length - 1)];
            }

            return String.Join(null, _password);
        }
        [HttpPost]
        [Route("HasPhoto")]
        public IHttpActionResult HasPhoto()
        {
            return WrapResponse(CurrentUser.Picture != null);
        }
        [AllowAnonymous]
        [HttpPost]
        [Route("IsAuthenticated")]
        public IHttpActionResult IsAuthenticated()
        {
            if (CurrentUser == null) return WrapResponse(false);
            else
                return WrapResponse(CurrentUser.Id != Guid.Empty);

        }
#if DEBUG
        [HttpPost]
        [Route("GetDomain")]
        public IHttpActionResult GetDomain()
        {
            return WrapResponse("ws://localhost");
        }
#else
        [HttpPost]
        [Route("GetDomain")]
        public IHttpActionResult GetDomain()
        {
            return WrapResponse("wss://de.ncfu.ru");
        }
#endif
    }
}