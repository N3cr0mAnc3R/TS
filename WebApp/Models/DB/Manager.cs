using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class Manager : IDisposable
    {
        protected Concrete Concrete { get; private set; }

        private bool SelfConcrete { get; set; }
        public Manager(ConnectionStringSettings settings)
        {
            SelfConcrete = true;
            Concrete = new Concrete(settings);
        }
        public Manager(Concrete concrete)
        {
            SelfConcrete = false;
            Concrete = concrete;
        }
        public void Dispose()
        {
            if (SelfConcrete) Concrete.Dispose();
        }
    }
}