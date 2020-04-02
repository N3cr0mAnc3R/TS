using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApplication1.Models
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