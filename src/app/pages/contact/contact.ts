import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// الترجمة
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// RxJS
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule
  ],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
})
export class Contact implements OnInit, OnDestroy {

  /** قائمة الإيميلات المعرّفة في الترجمة contact.emails */
  emails: string[] = [];

  /** نموذج الفورم (Reactive Form) */
  form!: FormGroup;

  /** فلاغ بسيط لإظهار حالة الإرسال (لو حبيت تستخدمه لاحقًا) */
  sending = false;

  /** إشتراك تغيير اللغة حتى نحدّث الإيميلات */
  private sub?: Subscription;

  constructor(
    private t: TranslateService,
    private fb: FormBuilder
  ) {}

  /** عند تحميل الكومبوننت */
  ngOnInit(): void {
    this.loadEmails();     // تحميل الإيميلات من ملف الترجمة
    this.buildForm();      // إنشاء الفورم و الفاليديشن
    // في حال تغيّر اللغة نعيد تحميل الإيميلات
    this.sub = this.t.onLangChange.subscribe(() => this.loadEmails());
  }

  /** تنظيف الإشتراك عند تدمير الكومبوننت */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** جلب الإيميلات من الترجمة contact.emails (لازم تكون Array) */
  private loadEmails(): void {
    this.t.get('contact.emails').subscribe((arr: string[]) => {
      this.emails = Array.isArray(arr) ? arr : [];
    });
  }

  /** بناء نموذج التواصل و تعريف الفاليديشن */
  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      country: [''],
      city: [''],
      // الرسالة الرئيسية
      message: ['', [Validators.required, Validators.minLength(10)]],
      // اختيار (اختياري): ما التقارير أو المواضيع التي تهمّك
      interest: ['']
    });
  }

  /** هيلبر مختصر للوصول للكونترول في الـ HTML */
  ctrl(name: string) {
    return this.form.get(name)!;
  }

  /**
   * إرسال البيانات عبر mailto
   * ملاحظة: هذا حل بسيط بدون باك-إند (يفتح برنامج البريد عند المستخدم)
   */
  send(): void {
    // لو الفورم غير صالح نعلّم كل الحقول بأنها تـُـمّ لمسها
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // أول إيميل من القائمة أو إيميل افتراضي
    const to = this.emails[0] || 'info@iccoc.org';

    // نصوص من الترجمة (ثابتة)
    const brand   = this.t.instant('app.brand');
    const heading = this.t.instant('mail.heading_admin');
    const fields  = this.t.instant('mail.fields');

    const v = this.form.value;

    // صياغة النص الذي سيصل في الإيميل
    const lines = [
      `${heading} - ${brand}`,
      '',
      `${fields.name}: ${v.name}`,
      `${fields.email}: ${v.email}`,
      `${fields.phone}: ${v.phone}`,
      `${fields.country}: ${v.country || '-'}`,
      `${fields.city}: ${v.city || '-'}`,
      '',
      this.t.instant('contact.form.interest') + ': ' + (v.interest || '-'),
      '',
      this.t.instant('contact.form.message') + ':',
      v.message
    ];

    // ترميز النص والموضوع لاستخدامهما في mailto
    const body    = encodeURIComponent(lines.join('\n'));
    const subject = encodeURIComponent(`${brand} – ${this.t.instant('contact.title')}`);

    // فتح برنامج البريد الافتراضي عند المستخدم
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }
}
