using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApplication1.Models.Account
{
    class PasswordNoHasher : IPasswordHasher
    {
        public string HashPassword(string password)
        {
            return password;
        }

        protected AccountManager AccountManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<AccountManager>();

            }
        }
        public PasswordVerificationResult VerifyHashedPassword(string hashedPassword, string providedPassword)
        {
            // вместо сравнения хешей проверяем правильность пароля для заданного пользователя (userName == hashedPassword в данном случае, т.к. ранее мы его вернули из GetPasswordHashAsync)
            return AccountManager.IsUserValid(hashedPassword, providedPassword) ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;
        }
    }
}