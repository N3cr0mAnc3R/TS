using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class Manager : IDisposable
    {
        protected Concrete Concrete { get; private set; }

        public Manager(Concrete concrete)
        {
            Concrete = concrete;
        }
        public void Dispose()
        {
            Concrete.Dispose();
        }
    }
}