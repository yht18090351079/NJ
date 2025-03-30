/**
 * 农产品供销信息平台 - 全局交互管理
 */

// 全局状态管理
const appState = {
  isLoggedIn: false,  // 登录状态
  isGuest: false,     // 游客登录状态
  currentUser: null,  // 当前用户信息
  notifications: 0,   // 通知数量
  cartItems: 0,       // 购物车商品数量

  // 检查登录状态
  checkLoginStatus() {
    // 检查是否是游客登录
    if (localStorage.getItem('isGuest') === 'true') {
      this.isGuest = true;
      this.isLoggedIn = true;
      this.currentUser = {
        id: 'guest',
        name: '游客用户',
        role: '游客',
        avatar: 'https://via.placeholder.com/64x64?text=游客'
      };
      return true;
    }

    // 从localStorage中获取token
    const token = localStorage.getItem('token');
    // 从localStorage中获取用户信息
    const userInfo = localStorage.getItem('userInfo');

    if (token && userInfo) {
      try {
        this.currentUser = JSON.parse(userInfo);
        this.isLoggedIn = true;
        this.isGuest = false;
        return true;
      } catch (e) {
        console.error('登录状态解析错误', e);
        // 清除无效数据
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
      }
    }
    this.isLoggedIn = false;
    this.isGuest = false;
    this.currentUser = null;
    return false;
  },

  // 模拟登录
  login(username, password) {
    // 模拟登录成功
    this.isLoggedIn = true;
    this.isGuest = false;
    this.currentUser = {
      id: 'user123',
      name: username || '张三农场',
      role: '农产品供应商',
      avatar: 'https://via.placeholder.com/64x64',
      verified: true,
      phone: username || '13800138000'
    };

    // 保存登录状态，使用与login.html相同的键名
    localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
    localStorage.setItem('token', 'mock_token_' + Date.now());
    localStorage.removeItem('isGuest');

    return true;
  },

  // 游客登录
  loginAsGuest() {
    this.isLoggedIn = true;
    this.isGuest = true;
    this.currentUser = {
      id: 'guest',
      name: '游客用户',
      role: '游客',
      avatar: 'https://via.placeholder.com/64x64?text=游客'
    };

    // 保存游客登录状态
    localStorage.setItem('isGuest', 'true');

    return true;
  },

  // 退出登录
  logout() {
    this.isLoggedIn = false;
    this.isGuest = false;
    this.currentUser = null;
    // 清除所有登录相关数据
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('selectedMenu');
    localStorage.removeItem('isGuest');
    sessionStorage.clear();
  }
};

// 页面交互初始化
document.addEventListener('DOMContentLoaded', function () {
  // 初始化导航栏
  initNavigation();

  // 检查登录状态
  appState.checkLoginStatus();

  // 检查页面特定功能
  initPageSpecificFeatures();
});

// 初始化导航
function initNavigation() {
  // 底部导航处理
  const bottomNavItems = document.querySelectorAll('.bottom-navbar .nav-item');
  if (bottomNavItems) {
    bottomNavItems.forEach(item => {
      // 添加点击动画效果
      item.addEventListener('click', function () {
        // 如果不是当前活跃项，添加点击波纹效果
        if (!this.classList.contains('active')) {
          const ripple = document.createElement('div');
          ripple.className = 'nav-ripple';
          this.appendChild(ripple);

          // 动画结束后移除
          ripple.addEventListener('animationend', function () {
            ripple.remove();
          });
        }
      });
    });

    // 发布按钮特殊交互
    const publishBtn = document.querySelector('.nav-publish');
    if (publishBtn) {
      publishBtn.addEventListener('click', function () {
        // 检查登录状态
        if (!appState.isLoggedIn) {
          showLoginModal();
          return;
        }

        // 导航到发布页面
        window.location.href = 'publish.html';
      });
    }
  }

  // 顶部搜索按钮交互
  const searchBtn = document.querySelector('.top-navbar .fa-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', function () {
      // 显示搜索弹窗
      showSearchModal();
    });
  }

  // 通知按钮交互
  const notificationBtn = document.querySelector('.top-navbar .fa-bell');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', function () {
      // 检查登录状态
      if (!appState.isLoggedIn) {
        showLoginModal();
        return;
      }

      // 显示通知弹窗
      showNotificationsModal();
    });
  }
}

// 初始化页面特定功能
function initPageSpecificFeatures() {
  // 获取当前页面
  const currentPage = getCurrentPage();

  switch (currentPage) {
    case 'index':
      initHomePage();
      break;
    case 'supply':
      initSupplyPage();
      break;
    case 'demand':
      initDemandPage();
      break;
    case 'user':
      initUserPage();
      break;
    case 'publish':
      initPublishPage();
      break;
  }
}

// 获取当前页面
function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();

  if (!filename || filename === '' || filename === 'index.html') {
    return 'index';
  }

  return filename.replace('.html', '');
}

// 登录模态框
function showLoginModal() {
  // 获取当前页面作为重定向参数
  const currentPage = getCurrentPage() + '.html';

  // 直接跳转到登录页，不显示模态框
  window.location.replace('login.html?redirect=' + currentPage);
}

// 搜索模态框
function showSearchModal() {
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.innerHTML = `
    <div class="search-modal">
      <div class="search-header">
        <div class="search-input-container">
          <i class="fas fa-search"></i>
          <input type="text" class="search-input" placeholder="搜索农产品、供应商等" autofocus>
          <span class="search-close">&times;</span>
        </div>
      </div>
      <div class="search-history">
        <div class="search-section-title">
          <span>搜索历史</span>
          <i class="fas fa-trash"></i>
        </div>
        <div class="search-tags">
          <span class="search-tag">有机蔬菜</span>
          <span class="search-tag">丹东草莓</span>
          <span class="search-tag">新鲜水果</span>
        </div>
      </div>
      <div class="search-hot">
        <div class="search-section-title">
          <span>热门搜索</span>
        </div>
        <div class="hot-list">
          <div class="hot-item">
            <span class="hot-rank">1</span>
            <span class="hot-keyword">时令水果</span>
            <span class="hot-tag">热</span>
          </div>
          <div class="hot-item">
            <span class="hot-rank">2</span>
            <span class="hot-keyword">有机蔬菜</span>
          </div>
          <div class="hot-item">
            <span class="hot-rank">3</span>
            <span class="hot-keyword">农家土鸡蛋</span>
          </div>
          <div class="hot-item">
            <span class="hot-rank">4</span>
            <span class="hot-keyword">东北大米</span>
          </div>
          <div class="hot-item">
            <span class="hot-rank">5</span>
            <span class="hot-keyword">绿色认证</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加到页面
  document.body.appendChild(modal);

  // 搜索输入框处理
  const searchInput = modal.querySelector('.search-input');
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const keyword = this.value.trim();
      if (keyword) {
        alert(`搜索: ${keyword}`);
        modal.remove();
      }
    }
  });

  // 点击关闭
  const closeBtn = modal.querySelector('.search-close');
  closeBtn.addEventListener('click', function () {
    modal.remove();
  });

  // 点击历史记录
  const historyTags = modal.querySelectorAll('.search-tag');
  historyTags.forEach(tag => {
    tag.addEventListener('click', function () {
      alert(`搜索: ${this.textContent}`);
      modal.remove();
    });
  });

  // 点击热门搜索
  const hotItems = modal.querySelectorAll('.hot-item');
  hotItems.forEach(item => {
    item.addEventListener('click', function () {
      const keyword = this.querySelector('.hot-keyword').textContent;
      alert(`搜索: ${keyword}`);
      modal.remove();
    });
  });

  // 点击清除历史
  const clearHistoryBtn = modal.querySelector('.search-history .fa-trash');
  clearHistoryBtn.addEventListener('click', function () {
    const historySection = modal.querySelector('.search-tags');
    historySection.innerHTML = '';
    alert('搜索历史已清除');
  });
}

// 通知模态框
function showNotificationsModal() {
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.innerHTML = `
    <div class="notifications-modal">
      <div class="notifications-header">
        <h3>消息通知</h3>
        <span class="notifications-close">&times;</span>
      </div>
      <div class="notifications-tabs">
        <div class="tab active" data-tab="system">系统通知</div>
        <div class="tab" data-tab="transaction">交易消息</div>
        <div class="tab" data-tab="activity">活动通知</div>
      </div>
      <div class="notifications-content">
        <div class="notification-item">
          <div class="notification-icon system">
            <i class="fas fa-bell"></i>
          </div>
          <div class="notification-info">
            <div class="notification-title">欢迎使用农产品供销信息平台</div>
            <div class="notification-desc">感谢您注册我们的平台，开始您的农产品交易之旅！</div>
            <div class="notification-time">2023-07-15 10:30</div>
          </div>
        </div>
        <div class="notification-item">
          <div class="notification-icon system">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="notification-info">
            <div class="notification-title">您的账户已完成实名认证</div>
            <div class="notification-desc">恭喜您已通过实名认证，可以使用平台的全部功能。</div>
            <div class="notification-time">2023-07-14 16:45</div>
          </div>
        </div>
        <div class="notification-item">
          <div class="notification-icon transaction">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="notification-info">
            <div class="notification-title">新订单通知</div>
            <div class="notification-desc">您有一个新的订单等待处理，请尽快确认。</div>
            <div class="notification-time">2023-07-13 09:20</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加到页面
  document.body.appendChild(modal);

  // 点击关闭
  const closeBtn = modal.querySelector('.notifications-close');
  closeBtn.addEventListener('click', function () {
    modal.remove();
  });

  // 选项卡切换
  const tabs = modal.querySelectorAll('.notifications-tabs .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const tabType = this.getAttribute('data-tab');
      alert(`切换到${this.textContent}选项卡`);

      // 这里应实现根据选项卡类型过滤通知列表
    });
  });
}

// 首页初始化
function initHomePage() {
  console.log('初始化首页交互');

  // 添加轮播图自动滚动
  const bannerContainer = document.querySelector('.banner-container');
  if (bannerContainer) {
    const bannerItems = bannerContainer.querySelectorAll('.banner-item');
    let currentIndex = 0;

    // 设置定时器自动轮播
    setInterval(function () {
      currentIndex = (currentIndex + 1) % bannerItems.length;
      bannerContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

      // 更新指示器
      const indicators = document.querySelectorAll('.banner-indicator span');
      if (indicators) {
        indicators.forEach((indicator, index) => {
          indicator.classList.toggle('active', index === currentIndex);
        });
      }
    }, 5000);
  }

  // 点击产品卡片查看详情
  const productCards = document.querySelectorAll('.product-card');
  if (productCards) {
    productCards.forEach(card => {
      card.addEventListener('click', function () {
        const productName = this.querySelector('.product-name').textContent;
        alert(`查看产品详情: ${productName}`);
        // 实际应用中应该跳转到产品详情页
      });
    });
  }
}

// 供应大厅页面初始化
function initSupplyPage() {
  console.log('初始化供应大厅交互');

  // 加载更多功能增强
  const loadMoreBtn = document.querySelector('.load-more');
  if (loadMoreBtn) {
    let page = 1;
    loadMoreBtn.addEventListener('click', function () {
      page++;

      // 显示加载状态
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';

      // 模拟网络请求延迟
      setTimeout(() => {
        // 加载更多产品
        const productGrid = document.querySelector('.product-grid');

        for (let i = 0; i < 4; i++) {
          const newProduct = document.createElement('div');
          newProduct.className = 'product-card';
          newProduct.innerHTML = `
            <img src="https://via.placeholder.com/300x300?text=产品${page}-${i + 1}" alt="产品图片" class="product-image">
            <div class="product-info">
              <div class="product-name">新增产品 ${page}-${i + 1}</div>
              <div class="product-price">
                ¥${(Math.random() * 20 + 5).toFixed(2)}<span class="product-unit">/斤</span>
              </div>
              <div class="product-address">
                <i class="fas fa-map-marker-alt"></i>产地-${page}${i + 1}
              </div>
              <div class="product-desc">这是加载的新产品描述，品质保证，新鲜直达。</div>
            </div>
          `;

          productGrid.appendChild(newProduct);

          // 添加点击事件
          newProduct.addEventListener('click', function () {
            const productName = this.querySelector('.product-name').textContent;
            alert(`查看产品详情: ${productName}`);
          });
        }

        // 恢复按钮状态
        this.textContent = '加载更多';

        // 模拟加载到底
        if (page >= 3) {
          this.innerHTML = '没有更多了';
          this.style.backgroundColor = '#f5f5f5';
          this.style.color = '#999';
          this.disabled = true;
        }
      }, 1500);
    });
  }
}

// 需求大厅页面初始化
function initDemandPage() {
  console.log('初始化需求大厅交互');

  // 加载更多功能增强
  const loadMoreBtn = document.querySelector('.load-more');
  if (loadMoreBtn) {
    let page = 1;
    loadMoreBtn.addEventListener('click', function () {
      page++;

      // 显示加载状态
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';

      // 模拟网络请求延迟
      setTimeout(() => {
        // 加载更多需求
        const demandList = document.querySelector('.demand-list');

        for (let i = 0; i < 2; i++) {
          const newDemand = document.createElement('div');
          newDemand.className = 'demand-card';

          const status = Math.random() > 0.5 ? '进行中' : '已截止';
          const statusStyle = status === '进行中'
            ? ''
            : 'style="background-color:#F5F5F5;color:#666;"';

          newDemand.innerHTML = `
            <div class="demand-header">
              <div class="demand-title">新增需求 ${page}-${i + 1}</div>
              <div class="demand-status" ${statusStyle}>${status}</div>
            </div>
            
            <div class="demand-info">
              <div class="demand-item">
                <i class="fas fa-boxes"></i>
                <span class="demand-item-label">需求量：</span>
                <span class="demand-item-value">${Math.floor(Math.random() * 100) + 1}吨</span>
              </div>
              <div class="demand-item">
                <i class="fas fa-calendar-alt"></i>
                <span class="demand-item-label">截止日期：</span>
                <span class="demand-item-value">2023-08-${Math.floor(Math.random() * 30) + 1}</span>
              </div>
              <div class="demand-item">
                <i class="fas fa-money-bill-wave"></i>
                <span class="demand-item-label">预算：</span>
                <span class="demand-item-value">${(Math.random() * 10 + 2).toFixed(1)}-${(Math.random() * 10 + 12).toFixed(1)}元/斤</span>
              </div>
              <div class="demand-item">
                <i class="fas fa-map-marker-alt"></i>
                <span class="demand-item-label">交货地：</span>
                <span class="demand-item-value">某地-${page}${i + 1}</span>
              </div>
            </div>
            
            <div class="demand-desc">
              这是新增的采购需求描述，详细说明产品规格、品质要求等信息。
            </div>
            
            <div class="demand-tags">
              <div class="demand-tag">新标签1</div>
              <div class="demand-tag">新标签2</div>
              <div class="demand-tag">新标签3</div>
            </div>
            
            <div class="demand-footer">
              <div class="demand-company">
                <img src="https://via.placeholder.com/32x32" alt="企业头像" class="company-avatar">
                <div class="company-name">新增企业 ${page}-${i + 1}</div>
              </div>
              
              <div class="demand-contact">
                <a href="tel:1234567890" class="contact-btn phone-btn" ${status === '已截止' ? 'style="background-color:#F5F5F5;color:#666;"' : ''}>
                  <i class="fas fa-phone-alt"></i>
                </a>
                <a href="javascript:void(0)" class="contact-btn message-btn" ${status === '已截止' ? 'style="background-color:#F5F5F5;color:#666;"' : ''}>
                  <i class="fas fa-comment"></i>
                </a>
              </div>
            </div>
          `;

          demandList.appendChild(newDemand);

          // 添加联系按钮点击事件
          const messageBtns = newDemand.querySelectorAll('.message-btn');
          messageBtns.forEach(btn => {
            btn.addEventListener('click', function () {
              if (status === '已截止') {
                alert('该需求已截止，无法联系');
                return;
              }

              const companyName = this.closest('.demand-footer').querySelector('.company-name').textContent;
              alert(`即将联系: ${companyName}`);
            });
          });
        }

        // 恢复按钮状态
        this.textContent = '加载更多';

        // 模拟加载到底
        if (page >= 3) {
          this.innerHTML = '没有更多了';
          this.style.backgroundColor = '#f5f5f5';
          this.style.color = '#999';
          this.disabled = true;
        }
      }, 1500);
    });
  }
}

// 个人中心页面初始化
function initUserPage() {
  console.log('初始化个人中心交互');

  // 检查登录状态并更新用户信息
  if (appState.isLoggedIn && appState.currentUser) {
    // 更新用户信息
    const userName = document.querySelector('.user-name');
    const userAvatar = document.querySelector('.user-avatar');

    if (userName) {
      userName.textContent = appState.currentUser.name;
    }

    if (userAvatar) {
      userAvatar.src = appState.currentUser.avatar;
    }
  } else {
    // 如果未登录，提示登录
    setTimeout(() => {
      alert('请先登录');
      showLoginModal();
    }, 500);
  }
}

// 发布页面初始化
function initPublishPage() {
  console.log('初始化发布页面交互');

  // 检查登录状态
  if (!appState.isLoggedIn) {
    alert('请先登录后再发布信息');
    setTimeout(() => {
      showLoginModal();
    }, 300);
  }

  // 表单验证增强
  const forms = document.querySelectorAll('form');
  if (forms) {
    forms.forEach(form => {
      // 获取所有必填输入框
      const requiredInputs = form.querySelectorAll('[required]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        let isValid = true;

        // 验证每个必填字段
        requiredInputs.forEach(input => {
          if (!input.value.trim()) {
            isValid = false;

            // 高亮显示错误
            input.classList.add('error');

            // 获取字段标签
            const label = input.closest('.form-group').querySelector('.form-label');
            const fieldName = label ? label.textContent.replace('*', '').trim() : '此字段';

            // 显示错误提示
            let errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = `请填写${fieldName}`;

            // 移除已有错误提示
            const existingError = input.closest('.form-group').querySelector('.error-message');
            if (existingError) {
              existingError.remove();
            }

            // 添加错误提示
            input.closest('.form-group').appendChild(errorMsg);
          } else {
            // 移除错误状态
            input.classList.remove('error');
            const existingError = input.closest('.form-group').querySelector('.error-message');
            if (existingError) {
              existingError.remove();
            }
          }
        });

        // 如果表单有效，模拟提交
        if (isValid) {
          // 显示加载状态
          const submitBtn = form.querySelector('.submit-btn');
          const originalText = submitBtn.textContent;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
          submitBtn.disabled = true;

          // 模拟网络请求
          setTimeout(() => {
            alert('信息提交成功，等待审核');

            // 重置表单
            form.reset();

            // 恢复按钮状态
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // 返回首页
            window.location.href = 'index.html';
          }, 1500);
        } else {
          alert('请完善表单信息');
        }
      });

      // 输入时移除错误状态
      requiredInputs.forEach(input => {
        input.addEventListener('input', function () {
          this.classList.remove('error');
          const errorMsg = this.closest('.form-group').querySelector('.error-message');
          if (errorMsg) {
            errorMsg.remove();
          }
        });
      });
    });
  }
} 